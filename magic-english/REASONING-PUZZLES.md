# 거울대칭·무게비교 상위 난이도 개편 (2026-10-25)

## 조사한 공개 교육 자료와 적용

- Cambridge NRICH [Let Us Reflect](https://nrich.maths.org/problems/let-us-reflect): 세로·가로뿐 아니라 대각선 대칭축 탐색, 반사 결과를 시각화하는 활동. [Transformations Worksheet](https://nrich.maths.org/content/id/14366/TransformationsStage3Star2Sheet1.pdf): 반사를 차례로 적용한 결과를 추론하는 유형. [Reflecting Squarely](https://nrich.maths.org/problems/reflecting-squarely): 그림을 보고 대칭 조건을 체계적으로 검사하는 확장 활동.
- QUT [YuMi Deadly Maths, Book 4: Algebra](https://research.qut.edu.au/ydc/wp-content/uploads/sites/181/2019/12/YDM-Book4-Algebra-2016.pdf): 저울을 이용한 미지수와 등식의 관계를 다루는 교수 자료.

자료의 도형·문항·이미지를 복제하지 않고 대각선/연속 반사, 되짚기, 등식의 동일한 양 변경과 여러 단서 연결이라는 개념을 자체 시드 생성기에 적용했다. 국내 영재교육원 기출문제를 재현하거나 인증된 학년별 레벨을 적용한 것은 아니며, 레벨은 게임 내 상대 난이도다.

## 거울대칭 레벨5

기존 4×3에서 빛3개를 좌우/상하로 한 번 반사하던 문제를 5×5, 두 번의 반사로 바꾼다. 반사축 두 개 중 하나는 대각선이며 순서를 바꾸면 결과가 달라지는 조합만 사용한다.

- 두 번 반사: 원본 → 안내된 거울① → 거울② → 마지막 그림을 직접 만든다. 중간 결과는 보여주지 않는다.
- 역추론: 마지막 그림과 사용했던 반사 순서를 주고 처음 그림을 복원한다.
- 오류 수정: 두 번 반사한 결과에서 정확히3칸을 바꾸어 제시한다. 잘못 켜진 칸/꺼진 칸을 모두 고친다.

같은 그림 복사, 반사 한 번만 수행, 순서 뒤바꾸기가 정답과 같아지는 패턴을 제외한다. 가로·세로·대각선 거울 안내와 명확한 시작/목표 라벨을 제공한다. 입력은 기존처럼 터치로 켜고 끄며 정답은 모든25칸의 일치로 결정한다. 힌트에는 완성 그림·정답 좌표·중간 그림을 노출하지 않는다.

## 무게비교

레벨4는 보석을 양쪽 저울에 배치한다. 같은 양 제거 → 남은 추 비교 → 여러 보석에 똑같이 나누기가 필요하다. 레벨5는 ◆/★ 두 미지수와 독립된 저울2개를 제공한다. 두 식의 계수행렬은 가역이며 양의 정수 해가 유일하다. 두 보기 이상이 저울1만으로 가능하고, 두 보기 이상이 저울2만으로 가능하도록 오답도 구성해 두 저울을 함께 사용해야 한다. 숫자를 크게 만드는 것만으로 난이도를 높이지 않는다.

새 모듈은 mirror-puzzles.js/balance-puzzles.js이며 공유 creative 게임은 바꾸지 않는다. 기존 낮은 레벨3 무게 문제는 유지하며 일반전은 최대4, 관장/보스는5라는 출제 정책도 유지한다. 이전 거울/저울 저장 문제는 개별 mirrorVersion/balanceVersion=2로 비용 없이 한 번 교체하고 이후 재접속에는 같은 새 문제와 입력을 유지한다.

## 검증과 테스트 주소

- `node --test tralalerio/tests/mirror-balance-reasoning.test.js tralalerio/tests/boss-math-policy.test.js`: 거울1000개를 독립 좌표 변환으로 검산, 세 모드/지름길 배제/오류3칸, 저울1000개의 유일해/두 단서 필요성, 레벨4, 저장 이관 및 보스 정책.
- `node --test tralalerio/tests/math-answer-integrity.test.js`: 활성 유형/레벨의 정답·선택지·저장 후 제출 검사. 무게는 화면에 표시한 두 식에서 독립적으로 정답을 계산한다.
- `node tralalerio/tests/browser-mirror-balance.mjs`: Chrome/WebKit, 390px/768px 터치, 거울3모드·무게4/5 실제 제출, 오답선택 교체, 힌트/초기화, 가로 넘침 방지와 모험 저장 보존. 전체 게임 회귀는 실행하지 않는다.

개발실 `/tralalerio/math-lab.html?type=mirror&grade=5&seed=12345` 및 `/tralalerio/math-lab.html?type=balance&grade=5&seed=12345`에서 확인한다. 시드를 바꾸면 다른 문제를 재현한다.
