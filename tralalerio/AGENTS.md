# 뜨랠레리오 개발 기준

이 게임은 `yeondu-town-web`의 후속 개발본이다. 작업 전에 `README.md`와 `../docs/tralalerio-continuation.md`에서 현재 범위와 원본 이력을 확인한다. 원본 기준은 `upstream/baseline.json`, 당시 원본 설명은 `upstream/README.md`다.

- 실행 소스는 이 폴더의 JS/HTML/CSS 및 `assets/`다. `public/tralalerio/`는 생성본이므로 직접 수정하지 않는다.
- 원본의 탐색·전투 규칙, 기술별 공격 연출, 회전 조우 전환과 저장 복원 흐름을 이어서 개발한다. ROM/에뮬레이터 실행으로 교체하지 않는다.
- 마인크래프트 24종과 기존 포켓몬의 조우 비율 60:40, 동일한 포획·파티·성장 규칙, 개인코드별 저장을 보존한다.
- 전투 계산과 표시 이벤트를 분리한다. 연출 중 입력 중복 및 새로고침에 따른 중복 턴·중복 포획을 방지한다.
- 개인 경로에서도 자산은 `/tralalerio/`를 기준으로 로드한다. 저장 키는 `tralalerio-save-v1[:개인코드]`다.
- 기본 회귀 검증: 저장소 루트에서 `npm run test:tralalerio`. UI/연출 변경은 로컬 서버를 실행하고 `npm run test:tralalerio-browser`로 검증한다.
- 자산 전체 재생성은 `node tralalerio/tools/rebuild-assets.cjs <역어셈블 저장소 경로>`를 사용한다. 원본 전투 자산 생성기만 실행하면 마인크래프트 데이터가 사라지므로 반드시 확장을 다시 적용한다.
- 외부 원본 업데이트는 `node tralalerio/tools/check-upstream.cjs`로 확인 후 변경을 검토해 반영한다. 원본 `dist/`로 이 폴더를 통째로 덮어쓰지 않는다.

- 공격 기술 선택 시 50%는 즉시 공격, 50%는 수학 치명타 도전이다. 정답은 치명타, 오답·넘기기는 내 공격 없이 상대 턴이다. 보조 기술은 즉시 실행한다. 초반 맵은 초급이며 12종 문제와 저장 복원을 유지한다. 상세 계약은 `MATH-BATTLE.md`를 따른다.

- 스토리·게임 기능 NPC는 원본 역할과 진행 조건을 유지한다. `chapter.js`와 `functional-npc.js`에서 먼저 처리하고, 진행과 무관한 일반 주민만 `npc-dialogue.js`의 선택형 생각 놀이를 사용한다. 알 배달이나 도구 지급을 수학 대화로 대체하지 않는다. 회복은 `state.healing` 마커를 저장해 재개하며, 표시 중 이동·메뉴·재시작을 막는다. 근거와 정책은 `CENTER-AND-DIALOGUE.md`를 따른다.

- 첫 배지 범위는 `FIRST-BADGE.md`를 따른다. 새 시작은 `Game.startAdventure()`이며 기존 동료/전투 저장은 강제 초기화하지 않는다. 맵 생성 → 기존 전투 → Minecraft → `build_first_badge.py` 순서를 보존한다. 트레이너 상대 큐·배지·상금은 저장 후 한 번만 처리한다.
