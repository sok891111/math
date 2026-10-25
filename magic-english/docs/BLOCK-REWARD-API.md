> 2026-10-25 최신 연결: 새 세계 초기 수량은 모든 블록 0개입니다. 나무는 참나무 원목(ID 5), 철 블록은 ID 33입니다. 마법영어 서버(`node server.cjs`)에서 모험과 `/block-world/`, 공용 보상 API를 함께 제공합니다. 대화 성공 1개/완전한 문장 2개, 조각 철 1개, Stage 완료 나무·흙·철 각 5개입니다. 기존 저장 수량은 초기화하지 않습니다.
>
> 모험 전용 `POST /api/magic-english/rewards`는 서버가 발급한 음성 확인 토큰을 받아 보상을 확정합니다. 브라우저가 수량을 정하지 않습니다. 조각/Stage 보상은 해당 Stage의 필수 발화 등록을 확인합니다. 지급 대기열은 모험 저장에 남고 재접속·온라인 복귀·10초 주기로 재시도합니다. `.block-world-data/.speech-signing-key`와 보상 원장을 함께 보존해야 재시작 후 대기 토큰도 유효합니다. 기존 API 키를 브라우저에 노출하지 않습니다. 개인 코드는 로그인 인증이 아니므로 현재 로컬 개발 범위입니다.

# 마법영어 → 블록 숲 보상 지급 API v1

마법영어의 퀘스트 완료 보상을 사용자별로 등록하면, 블록 숲이 보상을 받아 유한 수량 보관함에 추가한다. 서버의 보상 등록과 게임의 실제 수령은 별도 단계다. 같은 보상 ID의 재시도는 서버와 클라이언트에서 각각 중복을 방지한다.

현재 구현은 로컬 Node 서버 + 파일 보상 원장 + 브라우저 세계 저장이다. **원래 마법영어 게임의 퀘스트 완료 코드에서 POST를 호출하는 작업은 아직 연결하지 않았다.** 수신 API, 게임 자동 수령, 저장 및 통합 테스트는 구현되어 있다.

## 1. 실행 설정

```sh
# 실제 키는 서버 환경에만 설정한다. 이 문자열은 예시다.
export BLOCK_REWARD_API_KEY='replace-with-a-server-only-secret'
export PORT=4176
npm run dev:blocks
```

- 게임: `http://localhost:4176/block-world/?user=child-001&controls=easy`
- API 기본 주소: `http://localhost:4176/api/block-world`
- `BLOCK_REWARD_DATA_DIR`: 보상 파일 저장 폴더. 기본값은 프로젝트의 `.block-world-data/`이며 Git과 정적 파일 응답에서 제외된다.
- 서버는 환경변수를 직접 읽는다. `.env` 파일을 자동으로 읽지는 않는다.
- 키가 없으면 게임과 보상 조회는 동작하지만 지급 POST는 `503 API_KEY_NOT_CONFIGURED`를 반환한다.

사용자 코드가 없는 체험 게임은 API에서 `userId: "demo"`를 사용한다. 개인 게임은 URL의 `user`와 API의 `userId`를 정확히 일치시킨다. 사용자 코드는 1~80자이며 양끝 공백은 제거한다.

## 2. 보상 등록 — POST /rewards

마법영어 **백엔드**에서 호출한다. API 키를 웹 페이지나 아이의 브라우저 코드에 넣지 않는다.

요청 헤더:

```http
Authorization: Bearer <BLOCK_REWARD_API_KEY>
Content-Type: application/json
```

요청 예시:

```json
{
  "userId": "child-001",
  "rewardId": "stage1:quest:find-hwalbin:v1",
  "source": "magic-english",
  "reason": "활빈을 찾고 A 조각을 얻었어요",
  "blocks": [
    { "blockId": 1, "quantity": 10 },
    { "blockId": 6, "quantity": 5 },
    { "blockId": 10, "quantity": 3 }
  ]
}
```

| 필드 | 계약 |
|---|---|
| `userId` | 개인 게임과 같은 사용자 코드. 필수 |
| `rewardId` | 사용자별 고유 ID. 영문/숫자로 시작하고 영문·숫자·`.`·`_`·`:`·`-` 사용, 최대 120자 |
| `blocks` | 1~31개 항목. 각 `quantity`는 1~10000의 정수, 전체 지급 합계 최대 10000개 |
| `source` | 선택. 기본 `magic-english`, 최대 80자 |
| `reason` | 선택. 기본 빈 문자열, 최대 160자 |

같은 블록 ID를 여러 항목에 넣으면 수량을 합치고 ID 순서로 정규화한다. 기반암(32), 알 수 없는 ID, 0·음수·소수 수량은 거절한다. 본문 크기는 UTF-8 기준 최대 32KB다.

첫 등록은 `201`:

```json
{
  "created": true,
  "reward": {
    "userId": "child-001",
    "rewardId": "stage1:quest:find-hwalbin:v1",
    "blocks": [
      { "blockId": 1, "quantity": 10 },
      { "blockId": 6, "quantity": 5 },
      { "blockId": 10, "quantity": 3 }
    ],
    "source": "magic-english",
    "reason": "활빈을 찾고 A 조각을 얻었어요",
    "createdAt": "2026-10-25T00:00:00.000Z"
  },
  "delivery": "pending-client-sync"
}
```

동일 사용자·동일 ID·동일 내용의 재시도는 `200`, `created: false`다. 블록 순서와 중복 항목은 정규화한 뒤 비교하지만 `source`·`reason`도 내용에 포함한다. 같은 ID의 수량이나 설명을 바꾸면 `409 REWARD_CONFLICT`다. 다른 사용자는 같은 ID를 독립적으로 사용할 수 있다.

**`201/200`은 서버에 보상이 등록되었다는 뜻이며 브라우저 수령 완료를 뜻하지 않는다.** 서버 기록은 수령 후에도 남는다.

## 3. 원래 게임의 호출 코드

Node 백엔드 예시:

```js
// 사용자 ID는 로그인/개인 코드 검증을 마친 서버 측 값을 사용한다.
const payload = {
  userId: verifiedUser.id,
  rewardId: 'stage1:quest:find-hwalbin:v1',
  source: 'magic-english',
  reason: '활빈을 찾고 A 조각을 얻었어요',
  blocks: [
    { blockId: 1, quantity: 10 },
    { blockId: 6, quantity: 5 },
    { blockId: 10, quantity: 3 },
  ],
};

const response = await fetch(`${process.env.BLOCK_WORLD_ORIGIN}/api/block-world/rewards`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.BLOCK_REWARD_API_KEY}`,
  },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error(`블록 보상 등록 실패: ${response.status}`);
const result = await response.json();
// created=false도 정상 성공이다. 동일한 보상이 이미 등록된 것이다.
```

권장 순서:

1. 원래 게임 서버에서 퀘스트 완료와 지급 대기 항목을 저장한다.
2. 완료 기록에 연결된 **고정 rewardId**로 지급 API를 호출한다.
3. `200/201`이면 지급 등록 완료로 표시한다.
4. 네트워크 오류·`5xx`는 같은 ID와 본문으로 재시도한다. `400/401/409`는 원인을 수정한다.
5. 아이는 같은 `userId`의 블록 숲에 접속한다.

퀘스트 재대화나 새로고침 때 임의 UUID/현재 시각으로 새 보상 ID를 만들지 않는다. 반복 보상이 필요하면 검증된 완료 회차를 ID에 넣는다. API는 퀘스트 정답 여부를 판정하지 않으므로 완료 검증은 원래 게임 서버가 담당한다.

## 4. 보상 조회 — GET /rewards?userId=child-001

```json
{
  "version": 1,
  "userId": "child-001",
  "rewards": [
    {
      "userId": "child-001",
      "rewardId": "stage1:quest:find-hwalbin:v1",
      "blocks": [{ "blockId": 6, "quantity": 5 }],
      "source": "magic-english",
      "reason": "퀘스트 완료",
      "createdAt": "2026-10-25T00:00:00.000Z"
    }
  ]
}
```

`rewards`에는 해당 사용자의 모든 등록 보상 객체가 들어가며, 등록 이력이 없으면 빈 배열이다. 조회는 **지급 원장**이며 현재 남은 블록 수량 조회가 아니다. 블록 소비와 건축 저장은 브라우저에서 관리한다.

게임은 세계를 연 직후, 이후 10초마다, 페이지로 돌아왔을 때 조회한다. 메뉴 → 어른 설정 → **모험 보상 받아오기**로 수동 조회할 수도 있다. 요청은 8초 후 타임아웃하고 다음 주기에 재시도한다. 서버가 없어도 이미 보유한 블록과 건축은 유지된다.

## 5. 블록 목록 — GET /catalog

인증 없이 블록 ID·한글 이름·영어 이름·초기 수량·한도를 조회한다.

주요 ID:

| ID | 블록 | 새 시작 수량 |
|---|---|---|
| 1 | 잔디 | 0 |
| 2 | 흙 | 0 |
| 3 | 돌 | 0 |
| 5 | 참나무 원목 | 0 |
| 6 | 참나무 판자 | 0 |
| 33 | 철 블록 | 0 |
| 9 | 유리 | 0 |
| 10 | 벽돌 | 0 |
| 19 | 파란 블록 | 0 |
| 25 | 발광석 | 0 |

전체 목록의 기준은 `block-world/block-data.js`와 `/catalog` 응답이다. 지급 가능한 블록은 32종이고 기반암은 지급할 수 없다. 공격 막대기는 수량을 소비하지 않는 기본 도구이며 블록 지급 ID가 아니다.

## 6. 수량·저장·되돌리기 정책

- 새 시작은 잔디·흙·돌·참나무 판자 모두 0개, 합계 0개다. 다른 블록은 보상으로 받기 전까지 0개다.
- 설치가 성공하면 1개 차감한다. 수량 0이면 설치하지 않는다.
- **직접 설치한 블록**을 지우면 같은 종류 1개를 돌려받는다. 자연 지형을 지워도 보관함 수량은 늘어나지 않는다.
- 되돌리기는 세계 편집과 자원 증감을 함께 반대로 적용한다. 그 사이에 받은 새 보상과 영수증은 지우지 않는다.
- 수량·설치 출처·보상 영수증·건축 기록은 같은 `localStorage` 세계 객체에 저장한다. 보상 수량만 먼저 저장하거나 영수증만 따로 기록하지 않는다.
- 저장 공간 오류로 보상 저장에 실패하면 메모리상의 지급도 취소하고 다음 조회에서 재시도한다. 서버 원장은 삭제되지 않는다.
- 영수증은 `(userId, rewardId)`로 구분하고 정규화한 지급 내용을 함께 기록한다. 동일 ID의 다른 내용은 덮어쓰지 않는다.
- 현재 한도는 종류별 100만 개, 사용자별 서버 원장 및 세계 영수증 각각 2000건이다. 한도를 넘으면 지급/수령을 거절한다.

세계 JSON의 `inventory` 구조:

```json
{
  "version": 1,
  "counts": {},
  "placed": {},
  "receipts": {}
}
```

`placed`는 월드 내부 인덱스 → 설치 블록 ID다. `receipts`의 키는 `JSON.stringify([userId,rewardId])`, 값은 정규화한 블록 목록·source·reason의 JSON 서명 문자열이다. 서명은 중복 내용 비교용이며 암호학적 인증 서명이 아니다. 외부 게임은 이 필드를 직접 수정하지 말고 지급 API를 사용한다.

## 7. 이전 저장·새 세계·파일 복원

이전 무제한 저장은 건축물·위치·동물·핫바를 보존하고 보관함은 0개로 한 번 이관한다. 기존 수정 기록의 설치 블록도 보존하여 제거 시 반환할 수 있게 한다. 이관 이후에는 저장한 실제 남은 수량을 불러오며, 접속할 때마다 5개를 추가하지 않는다.

파일 내보내기에는 수량과 영수증도 포함된다. 같은 파일을 다시 불러와도 포함된 보상은 중복 수령하지 않는다. **새 세계 또는 영수증이 없는 오래된 파일**은 기본 수량에서 시작한 뒤 서버에 등록된 보상 전체를 다시 복원한다. 현재는 세계별 저장 모델이므로 여러 세계 사이에서 수량을 공유·이전하는 전역 지갑은 아니다. 같은 브라우저 저장을 여러 탭에서 동시에 편집하는 흐름도 지원 대상으로 삼지 않는다.

## 8. 오류와 운영 범위

| HTTP | 의미 |
|---|---|
| 200 | 조회 성공 또는 동일 지급의 재시도 성공 |
| 201 | 신규 지급 등록 |
| 400 | 필수 값·ID·수량·JSON 형식 오류 |
| 401 | 지급 API 키 오류 |
| 404 / 405 | 경로 / 메서드 오류 |
| 409 | 동일 ID의 내용 충돌 또는 보상 원장 한도 |
| 413 / 415 | 본문 크기 초과 / JSON Content-Type 아님 |
| 500 | 보상 파일 읽기·쓰기 실패. 기존 원장을 자동 초기화하지 않음 |
| 503 | 서버 지급 키 미설정 |

현재 서버는 `127.0.0.1`에서 실행하는 단일 프로세스 개발 서버다. 파일 변경은 사용자별 직렬화와 임시 파일 rename으로 처리한다. 지급 POST에는 서버 키가 필요하지만 GET의 사용자 코드는 로그인 인증이 아니다. 실서비스 연결 시에는 로그인된 사용자에 대한 조회 권한 검증, 지속 저장소, DB의 `(userId,rewardId)` 고유 제약과 트랜잭션을 호스팅 백엔드에 붙인다. 현재 파일 어댑터를 여러 서버 프로세스나 임시 파일 시스템에 그대로 배포하지 않는다.

브라우저 세계와 잔고는 로컬 저장이므로 서버가 잔고 조작을 검증하는 경제 시스템은 아니다. 현재 API 범위는 학습 보상의 **등록·전달·재시도·중복 수령 방지**다. 정적 서버는 GET API를 실행할 수 없으므로 API 기능은 `npm run dev:blocks`의 Node 서버나 이에 대응하는 백엔드 라우트에서 제공해야 한다. CORS를 열지 않았으며 원래 게임의 서버에서 서버 간 호출한다.

## 9. 구현과 검증

- `tools/block-reward-api.cjs`: 인증, 지급 원장, 동일 ID 처리, 파일 저장.
- `tools/serve-block-world.cjs`: 정적 게임 + API 서버.
- `block-world/inventory.js`: 수량, 편집·되돌리기 자원 처리, 영수증 판정.
- `block-world/reward-client.js`: 자동 조회·타임아웃·취소.
- `block-world/app.js`: 수령과 세계 저장을 한 번에 확정하고 UI 갱신.

```sh
npm run test:blocks
npm run test:blocks:rewards
```

두 번째 명령은 임시 저장 폴더와 임의 포트의 인증 서버를 자체 실행한다. 기존 사용자 저장이나 운영 보상 원장을 사용하지 않는다. 수량 소진·되돌리기·실제 HTTP 지급·중복 요청·저장 공간 오류 후 재시도·재접속·오프라인 보존을 Chrome/WebKit에서 검증한다.
