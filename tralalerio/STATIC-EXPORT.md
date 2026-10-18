# 서버 없이 실행하는 29번 도로 판

사용자 요청에 따라 본편을 수정하지 않고 **공박사 연구소, 연두마을, 29번 도로**만 담은 독립 사본을 생성한다. 기본 출력은 `/Users/gimseongjin/workspace/temp/tralalerio-static`이다. `index.html`을 Chrome/Safari에서 직접 열며 로컬 서버를 실행하지 않는다.

```sh
npm install --prefix /tmp/tralalerio-export-tools esbuild --no-audit --no-fund
node tralalerio/tools/export-static.cjs
node tralalerio/tools/check-static-export.cjs
```

다른 출력 폴더는 첫 인자로 지정한다. esbuild 설치 위치는 `ESBUILD_MODULE`로 바꿀 수 있다. 본편 소스와 `public/`는 바꾸지 않는다.

생성기는 기존 ES 모듈들을 classic IIFE 스크립트로 묶고, JSON 및 회복 WAV를 `offline-data.js` 안에 담는다. 데이터 조회는 메모리에서 응답하며 `file://`에서 차단되는 네트워크 fetch나 ES 모듈 로딩을 하지 않는다. 이미지·공용 Creative 문제 스크립트·CSS도 출력 폴더 안의 상대 경로로 사용한다. 폴더 전체를 복사해야 한다.

실제 맵 데이터와 연결은 세 지역만 포함한다. 다른 집·도시·게이트의 워프는 엔진의 기존 조용한 경계 처리로 차단한다. 지도 선택지도 연두마을/29번 도로로 제한하며 전투 데이터의 다른 지역 조우표·트레이너는 제외한다. 종·기술·진화와 도감 설명 자산은 기존 데이터를 보존한다.

피카츄와 연구소에서 시작하며 첫 인사를 자동으로 보여 준다. 박사에게 말하면 회복하고 조수에게 말하면 몬스터볼을 최소 5개까지 보충한다. 알 배달 등 범위 밖 목표는 이 사본의 목표에서 제외한다. 전투·수학 공격·수학 포획·성장·레벨 진화·도감·메뉴·기존 음향 정책은 본편 코드를 사용한다. Violet 치트 진입은 비활성화한다.

저장은 `tralalerio-static-route29-v1`이라는 별도 localStorage 키를 사용한다. 개인코드 서버 동기화는 없으며 같은 브라우저/파일 위치의 저장이다. 기존 본편 저장을 읽거나 덮어쓰지 않는다.

검증은 HTTP 요청을 전부 차단한 Chrome과 WebKit에서 `file://`로 수행한다. 연구소 시작과 실제 출입, 연두마을↔29번 도로 이동, 박사 회복, 저장/재실행, 지도/도감, 풀밭 조우, 문제 선택·정답 제출·확정 포획 및 첫 포획 소개를 확인한다. 야생 조우 확률만 고정하고 게임 입력과 문제 판정은 실제 UI를 사용한다.
