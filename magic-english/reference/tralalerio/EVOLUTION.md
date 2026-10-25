# 골드 레벨 진화와 수학 정답 판정

사용자 요청으로 **레벨업에 의한 자연 진화만** 적용한다. 현재 등장 포켓몬에서 이어지는 원본 레벨 진화 경로 46개를 구현했다. 원본 93종이 전투 데이터에 존재하며 진화 후 능력치·기술·앞뒤 그림을 포함한다. 조우 목록과 비율은 유지한다.

기준은 [한국판 골드 역어셈블](https://github.com/Narishma-gb/pokegold-kr/tree/c90f31dadef17f033a8f1bdada701b26cef18241), 특히 [진화 조건과 후처리](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/engine/pokemon/evolve.asm), [종별 진화표](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/data/pokemon/evos_attacks.asm), `engine/movie/evolution_animation.asm`이다.

- 전투 중 레벨이 오른 동료만 전투 종료 후 정해진 진화 레벨을 검사한다. 한 번의 전투에서 한 단계만 진화하며 여러 동료는 파티 순서대로 진행한다. 취소하면 다음 레벨 상승 때 다시 검사한다.
- 진화 시 경험치·개체값·노력치·기존 기술과 PP를 유지하고 새 능력치를 계산한다. 최대 HP 증가분을 현재 HP에 더한다. 진화한 종의 현재 레벨 기술을 배우며 4개가 찼으면 교체 여부를 묻는다. 도감에 발견/포획으로 등록한다.
- 원본처럼 옛 모습과 새 모습의 흰 실루엣이 점점 빨리 번갈아 표시된다. 웹 애니메이션 구현이며 하드웨어 프레임 단위 복제는 아니다. 진행 마커를 저장해 새로고침 시 재개하고 도감/진화를 중복 처리하지 않는다.
- 교환·진화의 돌·친밀도·시간대·능력치 비교 진화는 추가하지 않는다. 진화용 교환 화면과 도구 사용 화면도 없다. 피카츄처럼 원본에서 레벨 진화를 하지 않는 종은 레벨이 높아져도 그대로 유지한다. 뮤·코라이돈·Minecraft 몬스터에게 임의의 진화를 만들지 않는다. 기존 스토리 NPC의 모다피/롱스톤 교환 기능은 유지한다.

재생성: `python3 tralalerio/tools/build_evolution_assets.py /tmp/pokemon-gold-kr-research`. 통합 `rebuild-assets.cjs`에서 Minecraft·추가 포켓몬 적용 후, 도감 생성 전에 실행한다.

수학 판정 수정:

- 답 칸이 찬 뒤 새 보기를 누르면 선택만 하고 기존 답을 유지하던 동작을 로컬 UI에서 수정했다. 하나짜리 답은 즉시 새 값으로 교체하고 선택 상태를 표시한다.
- 회전은 보기 번호가 아니라 실제 회전한 그림을 비교한다. 숫자 격자는 모든 행/열의 조건을 검사해 다른 올바른 풀이도 허용한다.
- 가로 거울은 지문대로 원본 위/답 아래로 배치한다.
- 개발실의 판정 결과는 실제 수학 제출 결과를 사용한다. 정답 후 전투에서 행동 불능이 되어 공격 이벤트가 없어도 수학 오답으로 표시하지 않는다.
- 54,000문제의 정답 선택지 존재·독립 계산·재현성을 검사하고 32유형의 공격/포획 정답 제출을 저장 복원 후 확인한다.

검증: `node --test tralalerio/tests/evolution.test.js tralalerio/tests/math-answer-integrity.test.js`, `node tralalerio/tools/check-evolution-math-browser.cjs`, `node tralalerio/tools/check-evolution-controls-browser.cjs`.
기존 전체 단위 검증에는 최신 비율·문제 수·뺄셈 레벨1 정책 반영 전부터 실패하던 10개가 있으며, 변경 전 스냅샷에서도 동일한 실패를 확인했다.
