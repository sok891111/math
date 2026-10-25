# 고동마을과 인섹트배지

기준은 `Narishma-gb/pokegold-kr`의 고정 커밋 `c90f31dadef17f033a8f1bdada701b26cef18241`이다. 하트골드의 퍼즐이나 파티로 바꾸지 않고 골드의 좌표·충돌·연결·워프·NPC·트레이너 파티·시간대별 육상 출현표를 정적 자산으로 추출한다.

- [32번 도로](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/maps/Route32.asm): 윙배지와 센터 조수의 알을 받은 뒤 남하. 기적의씨, 도로 트레이너, 남쪽 센터와 낡은낚싯대 지급.
- 연결동굴 1층 → 33번 도로 → 고동마을. 연결동굴 지하층과 야돈우물 지하 2층도 원본 지도/충돌을 보존하되 파도타기·괴력 구간은 아직 통과하지 못한다.
- [강집의 집](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/maps/KurtsHouse.asm)에서 사건을 듣고 우물 입구가 열린다. 강집은 집에서 사라지고 우물 아래에 나타난다.
- [야돈우물](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/maps/SlowpokeWellB1F.asm)의 원본 로켓단 4명. 마지막 `TrainerGruntM1`을 이기면 로켓단이 사라지고 야돈들이 마을로 돌아온다. 강집의 집 (3,3)으로 돌아와 회복하고 강집에게 루어볼을 한 번 받는다.
- [고동 체육관](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/maps/AzaleaGym.asm)은 우물 해결 후 개방. 원본 벌레소년·쌍둥이와 호일의 단데기 14 / 딱충이 14 / 스라크 16을 사용한다. 쌍둥이는 한쪽만 이겨도 양쪽 완료. 호일의 연속자르기는 연속 명중 시 10→20→40→80→160의 위력으로 증가하고 빗나가거나 다른 기술을 쓰면 초기화한다.
- 인섹트배지와 TM49, 원본 상금 1600원은 완료 처리 때 한 번만 지급. 윙배지와 TM31을 중복 지급하지 않는다. 관장 각 포켓몬 마지막 타격의 레벨 4 필수 문제 규칙도 그대로 적용한다.
- 우물 해결 뒤 [마을 서쪽 라이벌](https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/maps/AzaleaTown.asm)은 (5,10/11)에서 반대편 줄의 (11,11/10)부터 왼쪽으로 6칸 접근한다. 파티는 고오스12·주뱃14·마그케인16. 접근과 전투를 저장·복원한다.

총 46개 맵 / 50개 트레이너 / 14개 육상 서식지. 추가 야생 종도 수학 포획·첫 도감 소개·파티·PC·개인별 저장을 공통으로 쓴다. 마인크래프트60% / 포켓몬40%, 뮤·코라이돈 각1%, 엔더드래곤·위더 각1%를 보존한다. 고동·32번 도로 센터의 회복 연출, PC, 전멸 복귀와 재접속도 지원한다.

웹 엔진의 기존 범위를 이어받는다. 원작 스크립트 전체 실행, 알 부화/진화, 낚싯대 사용, 규토리 볼 제작 대기, 파도타기·괴력, 너도밤나무숲 이후와 알프유적 분기는 이 장에 포함하지 않는다. 알과 특별 볼/도구는 가방 지급 기록으로 관리한다. 강집의 이동은 위치/대사 이벤트로 처리하며 원작의 개별 이동 타이밍·음악 전체를 재현했다고 주장하지 않는다.

재생성: `node tralalerio/tools/rebuild-assets.cjs /tmp/pokemon-gold-kr-research`.
검증: `tests/second-badge.test.js`, `tests/browser-second-badge.mjs`. 이전 저장을 초기화하지 않고 다음 목표로 이어간다.
