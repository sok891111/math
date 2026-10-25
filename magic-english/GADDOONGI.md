# 거뚱이

사용자가 제공한 그림의 캐릭터 부분을 마스크로 잘라 그대로 사용한다. 새 그림이나 AI 생성 결과물을 사용하지 않는다. 원본은 `tools/artwork/gaddoongi-reference.png`, 추출 레시피는 `tools/add-gaddoongi.cjs`다. 앞모습은 제공 그림, 아군 쪽 이미지는 같은 그림의 좌우 반전이며 별도 뒷모습을 새로 그리지 않는다.

`mc_gaddoongi` / `minecraftKind: gaddoongi`로 Minecraft 계열과 같은 목록·전투·수학 포획·성장·PC·도감 저장 흐름에 포함한다. 확장 몬스터는 기존 28종과 거뚱이·메가 플라이·자이언트 플라이으로 총 31종이다. 물/강철, 키 1.8m, 몸무게 210kg, 레벨 6으로 등장한다. 초반 동료 수준의 능력치와 위력35/명중100/PP25의 물 기술 **네 갈래 물대포**를 사용한다. 네 줄기의 물방울이 서로 다른 출발점에서 날아와 모이고 물보라가 퍼지는 연출이다.

30번·31번·32번 도로와 도라지 쪽 어둠의 동굴에서 아침/낮/밤 모두 야생 조우의 20%로 등장한다. 도시의 일반 길에서는 강제로 조우하지 않는다. 다른 서식지에는 등장하지 않는다. 포켓몬60%/Minecraft계열40%, 원본 골드 슬롯의 상대 비중과 뮤·코라이돈·엔더드래곤·위더 각각 전체1% 정책은 유지한다. 거뚱이의 20%는 이 지역의 Minecraft40% 안에서 배분한다.

지역 특화 몬스터의 비중은 `assets/challenge-policy.json`의 `featuredSpecies`에서 관리한다. 등장하지 않는 맵에는 가중치0 슬롯을 두며 도감의 분포 보기에서도 제외한다.

전체 재생성 순서: add-minecraft → add-gaddoongi → add-fly-monsters → apply-challenge-policy → build_evolution_assets → build_dex_assets → sync-public. 그림만 다시 추출할 때도 `node tralalerio/tools/add-gaddoongi.cjs` 뒤 정책 적용과 배포 동기화를 수행한다.

검증: `node --test tests/gaddoongi.test.js tests/minecraft-skills.test.js tests/new-minecraft.test.js tests/challenge-policy.test.js`(tralalerio 디렉터리), `node tralalerio/tools/check-gaddoongi-browser.cjs`(루트).

## 메가 플라이와 자이언트 플라이

추가 제공 그림 `tools/artwork/fly-monsters-reference.png`에서 두 캐릭터를 각각 추출한다. `tools/add-fly-monsters.cjs`가 이미지를 재생성하고 전투 데이터에 `mc_megaply` / `mc_giantfly`를 추가한다. 새 그림을 그리거나 생성하지 않는다. 아군 쪽 이미지는 원본 추출 이미지의 좌우 반전이다.

둘 다 비행/강철 타입이며 메가 플라이는 키1.2m/45kg, 자이언트 플라이는 키4.8m/320kg이다. 메가 플라이는 레벨36에 자이언트 플라이로 자연 진화하고, 진화 후 `거대 폭풍`을 배울 수 있다. 네 기술이 차 있으면 원본과 같은 기술 교체 선택을 제공한다. `메가 윈드`와 `거대 폭풍`은 각각 바람 고리와 회오리/폭풍 입자로 표현한다. 두 기술 모두 위력35이고 진화 후 능력치가 증가한다.

동일한 네 서식지에서 메가 플라이는 전체 조우의8%(레벨6), 자이언트 플라이는2%(레벨12), 거뚱이는20%다. 자이언트의 야생 레벨은 초반 지역의 전투 균형을 위해12로 설정하며, 잡은 메가 플라이의 진화 조건은36으로 유지한다. 합계30%는 전체 확장 몬스터40% 안에서 배분한다. 다른 지역에는 세 몬스터 모두 등장하지 않는다.

추가 검증은 `tests/fly-monsters.test.js`와 메가→자이언트 실제 전투 경험치/저장 복원/기술 교체 흐름을 포함한다.

브라우저 검증: `node tralalerio/tools/check-gaddoongi-browser.cjs`와 `node tralalerio/tools/check-fly-monsters-browser.cjs`는 Chrome·Safari에서 포획, 제공 그림, 도감, 실제36레벨 진화, 기술 교체 및 저장 복원을 확인한다.
