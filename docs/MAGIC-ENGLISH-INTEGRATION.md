# 마법영어 통합 및 Vercel 배포

## 실행과 게이트

- 게임 이름/폴더: `magic-english` / `magic-english/`.
- 개인 게이트 `/<개인코드>`의 **마법영어** → `/<개인코드>/magic-english`.
- 체험: `/magic-english`.
- 건축: `/magic-english/block-world?user=<개인코드>&returnTo=<모험주소>`.
- 로컬은 저장소 루트에서 `npm run dev`, 배포 빌드는 `npm run build`다. 기존 Vercel Next.js 프로젝트에 함께 포함된다. 별도의 Vercel 프로젝트나 정적 서버가 필요하지 않다.
- `magic-english/`를 수정하고 `scripts/sync-public.cjs`로 공개 자산을 생성한다. `public/magic-english/`는 직접 수정하지 않는다.

## Vercel 환경변수

Vercel 프로젝트 Settings → Environment Variables에 설정하고 재배포한다. 키 값을 브라우저 코드에 넣지 않는다.

| 변수 | 설정 |
|---|---|
| `ELEVENLABS_API_KEY` | **필수 신규 설정**. 서버 전용. Production/Preview 등 사용할 환경을 선택한다. |
| `SUPABASE_URL` | 기존 block-island의 Supabase URL. |
| `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_ANON_KEY` | 기존 `kv_store`를 읽고 쓸 서버용 키. 기존 플랫폼과 같은 테이블을 사용한다. |
| `MAGIC_ENGLISH_SIGNING_SECRET` | 선택. 지속적인 보상 서명 키. 미설정이면 ElevenLabs 키를 기반으로 서명한다. 키 변경 시 기존 미전달 음성 확인 토큰의 호환성에 유의한다. |
| `MAGIC_ENGLISH_STT_KEYTERMS` | 기본 활성. `false`이면 단어 문맥 힌트를 끈다. 공급자의 추가 요금이 적용될 수 있다. |
| `BLOCK_REWARD_API_KEY` | 선택. 다른 게임 서버가 블록 지급 API를 호출할 때만 설정한다. 브라우저에는 전달하지 않는다. |

`NEXT_PUBLIC_ELEVENLABS_API_KEY`는 만들지 않는다. 다른 프로젝트의 환경 파일이나 개인 문서에서 키를 찾는 코드는 통합 실행 경로에서 사용하지 않는다. `.env.example`의 신규 값은 비어 있으며 사용자가 직접 설정한다.

## 서버 기능

`pages/api/magic-english/[...action].js`가 아래 경로를 제공한다.

- `GET/POST /api/magic-english/assess-pronunciation`: 설정 상태와 Scribe v2 음성 인식.
- `POST /api/magic-english/character-voice`, `/welcome-voice`: 고정 배역의 신규 음성 준비.
- `POST /api/magic-english/rewards`: 서명된 발화 확인과 조각/Stage 보상을 등록.
- `GET /api/magic-english/block-world/rewards?userId=...`: 건축 게임 자동 수령.
- `GET /api/magic-english/block-world/catalog`: 블록 목록.
- `POST /api/magic-english/block-world/rewards`: 선택적 서버 인증 지급.

보상은 `kv_store`의 `magic-english:reward:...` 개별 행으로 저장한다. 동일 보상 ID는 한 번만 발행하고 내용이 다르면 거절한다. 기존 사용자의 플랫폼/다른 게임 기록과 키가 겹치지 않는다. 새 동적 음성 캐시는 `magic-english:voice:...`에 저장한다. Vercel에서는 로컬 파일이나 프로세스 메모리를 영구 저장소로 쓰지 않으며 Supabase 미설정 시 지급을 실패 처리한다. 로컬 개발에는 `.magic-english-data/` 파일 어댑터가 있다.

기존 플랫폼과 마찬가지로 개인 코드는 접속 식별자이며 별도 로그인 인증은 아니다. 보상 등록은 음성 확인 서명을 검증하고 사용자가 블록 수량을 지정할 수 없다.

## 음성 지연·Bus·Speak 수정

- 현재 대사 141개를 ElevenLabs 고정 배역의 MP3로 준비했다. 배포 빌드에서 TTS 생성하지 않는다.
- 음성 파일을 백그라운드로 받아 두고 실제 대화의 다음 페이지를 미리 디코딩한다. 시작할 때 모든 음성을 동시 디코딩하지 않는다.
- 에이미는 Fena 원음을 유지한다. 링고는 고정 로봇 처리, 미스스펠은 Bill/저음 처리를 유지한다. 기기 기본 음성으로 전환하지 않는다.
- 피크 제한과 짧은 재생/종료 페이드를 적용해 큰 피크와 갑작스러운 잘림을 줄인다.
- 짧은 Bus 발화는 긴 무음을 포함한 전체 평균 음량으로 거절하지 않는다. 30ms 구간의 음량으로 감지하고 앞뒤 여유를 남겨 무음을 정리한다.
- 문장 안의 `bus/buss/buzz/버스` 인식 변형과 축약형을 처리한다. 최신 문장 정책에 따라 단어 하나만 말해서 문장 퀘스트를 통과할 수는 없다.
- 마이크 준비·녹음·분석 상태를 구분하고 중복 입력을 막는다. 대화를 닫으면 이전 세션을 취소하며 이전 결과가 새 대화에 반영되지 않는다. 오류 후에는 바쁜 상태가 해제된다.
- 마이크는 HTTPS 또는 localhost에서 실행해야 한다. 실제 아동 발음·iPad 권한은 기기에서 확인해야 한다.

단어 문맥 힌트 계약은 [ElevenLabs 공식 문서](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/keyterm-prompting)를 따른다. 마이크 녹음 원본은 Supabase에 저장하지 않는다.

## Stage 2와 이동

기존 원작/최신 변경의 Bus·Bag·Big 단서, 오해 삼총사, 버스 기사, 간판 복구, 보스의 짐칸 봉인, 보따리·활빈당 표식·B 조각, 다음 C 모험 예고를 보존했다. `advanceStage2`로 실제 성공 콜백과 체크리스트의 진행 상태를 함께 갱신한다.

공항 출구·버스 문·하차문·이전 정류장·다음 출발 게이트는 준비 조건을 충족한 뒤 해당 타일로 걸어가면 이동한다. 마지막 정류장에서 이전 정류장으로 돌아갈 수 있다. 도착 위치를 입구 바깥에 두어 왕복 이동이 반복되지 않게 했다. 단어 조사와 대화는 기존 A/Space 조작을 유지한다.

건축 첫 입장은 평지·블록 0개이며 기존 세계가 있으면 이어 연다. 모험 ↔ 건축 전환, 큰 블록 소진 안내창, 복귀 버튼, 나무 1~2개·조각 철 1개·Stage 나무/흙/철 각 5개 보상을 유지한다.

## 이관 범위와 저장

이전 실행 코드·전체 assets·Three.js vendor/라이선스·Stage 1/2 이야기·반복 대화·지도/NPC·원작 이미지·도감·건축·문서·생성 도구·관련 단위 테스트를 가져왔다. 원본 코드 이력과 reference도 소스 폴더에 보존한다. `MIGRATION-MANIFEST.json`에 파일별 원본/이관 해시와 제외 범위를 기록한다. 공개 자산은 실행 JS/HTML/CSS와 assets, creative, block-world의 허용 파일만 복사한다.

API 키, `.env*`, `.block-world-data`의 개인 보상/서명 키, node_modules, 테스트 산출물은 공개 자산에 포함하지 않는다. 기존 브라우저 모험/건축 저장 키와 개인 코드 분리는 유지한다. **localhost와 실제 서비스는 브라우저 저장소 출처가 다르므로 기존 로컬 플레이 기록이 자동으로 옮겨지지는 않는다.** 원본 저장을 초기화하지 않으며 다른 게임 저장도 건드리지 않는다. 건축 파일 내보내기/가져오기는 유지한다.

## 확인 명령

```sh
npm run test:magic-english
npm run build
```

첫 명령은 해당 기능의 단위 테스트다. 전체 게임/브라우저 테스트는 실행하지 않는다. 이관 시 로컬 production 서버에서 모험 HTML·건축 HTML·Three.js·Stage 2 이미지·설정 조회 API의 HTTP 200도 확인했다. 실제 Vercel 배포는 사용자가 환경변수를 설정한 뒤 기존 프로젝트 배포 흐름으로 진행한다.

## 크리퍼·좀비·무기 보상 / A 입력

- 새 세계에 기존 돼지 4·닭 4와 크리퍼 2·좀비 2가 등장한다. 기존 저장에는 새 몬스터만 한 번 추가하고 건축·기존 동물을 유지한다.
- 좀비·크리퍼는 가까운 플레이어를 향해 이동한다. 크리퍼는 가까이 머무르면 점멸 후 연기 효과로 사라졌다가 다시 등장한다. 이 효과는 세계의 블록을 변경하지 않는다.
- 문장 전체가 일치해 `quality=complete`로 인식되면 기존 나무 2개와 함께 검 1개를 지급한다. 한 단어·부분 답변·실패에는 검이 지급되지 않는다.
- 검은 나무 45% / 돌 30% / 철 20% / 다이아몬드 5%, 공격력은 각각 2/3/4/6이다. 기본 막대기는 1이다. 무기는 공격할 때 소모되지 않는다.
- 검 종류는 서버가 발화 ID와 서명 키를 바탕으로 정하고 서명된 확인 토큰에 담는다. 클라이언트가 무기 종류를 지정할 수 없다. 재시도 시 동일한 검이 한 번만 지급된다. 이전 보상 영수증 형식은 유지한다.
- 보상 API의 선택적 `items: [{itemId:'iron_sword',quantity:1}]`가 무기 보상이다. 건축 보관함에는 `inventory.weapons`에 저장한다. B 블록/무기 선택 창에서 고르고 A로 공격한다. 핫바에는 가장 강한 보유 검의 빠른 선택 칸이 표시된다.
- A는 일반 대사·구출 연출·보스 대사·조각 획득 대화 모두 다음으로 넘긴다. 말하기는 A로 녹음 시작/완료하며 분석 중에는 기다린다. 성공을 건너뛰지 않는다. 선택 대화는 방향키로 선택하고 A로 확인한다. 기존 다음 버튼도 같은 함수를 호출한다.
- 단위 확인: `node --test magic-english/tests/magic-weapons-monsters.test.js magic-english/tests/block-animals.test.js magic-english/tests/block-inventory.test.js tests/magic-english-integration-unit.cjs`.

## 생활 문장·보스 문제·낮밤·닭 아이템 (최신)

말하기 대상은 `magic-english-practice.js`에서 공유한다. 단서 조사·반복 NPC·Stage 1/2 보스의 표시 문장, 가이드 음성, 서버 정답 판정이 같은 정책을 사용한다. 이전 단어만 따라 하는 설명보다 이 정책이 우선한다.

| 대상 | 연습 문장 |
|---|---|
| Airplane | I see an airplane. |
| Apple | I want an apple. |
| Ask | Can I ask you? |
| Bus | Here is the bus. |
| Bag | This is my bag. |
| Big | It is a big bus. |

A 보스는 Airplane → Apple → Ask 문장으로 세 번의 마법을 푼다. B 보스는 Big/Bus 문장 → Bag 문장으로 짐칸 봉인을 푼다. 핵심 단어를 문장 순서로 말하면 부분 성공(나무 1개), 전체 문장은 완전 성공(나무 2개+검 1개)이다. 관사 생략은 부분 성공으로 인정한다. 무음·단어 하나·뒤섞인 단어는 성공 처리하지 않는다. 기존 진행 저장은 초기화하지 않는다.

낮밤은 360초 한 주기(낮 65%, 밤 35%)이며 게임이 활성 상태일 때 흐른다. 크리퍼·좀비는 밤에만 보이고 공격할 수 있다. 낮에는 돼지·닭만 보인다. 기존 쉬운 모드에도 낮밤 순환을 한 번 활성화하고, 이후 보호자 설정의 순환 해제는 유지한다. 시간과 동물 상태는 저장된다.

닭을 잡으면 생닭고기 1개와 깃털 0~2개를 자동으로 획득한다. `inventory.loot`에 보관하고 블록/무기 선택 창에서 수량을 확인한다. 현재 음식 섭취·제작·배고픔 기능은 없다.
