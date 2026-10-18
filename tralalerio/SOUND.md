# 골드 악보 기반 사운드

현재 46개 맵에 배경음악을 배치하며, 트레이너 종류별 조우 음악과 야생 낮/밤·일반 트레이너·라이벌·로켓단·관장 전투 및 승리 음악까지 30곡을 사용한다. 원본 지도의 음악 상수와 트레이너별 조우 표를 그대로 조회한다. 전투 승리 음악은 공격 연출이 끝난 뒤 재생하고, 모험 복귀 시 해당 맵의 음악으로 전환한다. 동일 곡을 사용하는 맵 사이에서는 곡을 처음부터 다시 틀지 않는다.

## 근거와 생성

기준 저장소: https://github.com/Narishma-gb/pokegold-kr

고정 커밋: `c90f31dadef17f033a8f1bdada701b26cef18241`.

- `data/maps/maps.asm`: 맵별 음악
- `data/trainers/encounter_music.asm`: 트레이너 직업별 조우 음악
- `constants/music_constants.asm`, `audio/music_pointers.asm`: 상수→곡 이름
- `engine/battle/start_battle.asm`: 낮/밤 야생·관장·라이벌·로켓단 전투 구분
- `audio/music/*.asm`: 음표, 쉼표, 템포, 음량, 듀티, 팬, 서브루틴, 반복
- `audio/notes.asm`, `audio/wave_samples.asm`, `audio/drumkits.asm`: 주파수·파형·타악기
- `audio/sfx.asm`: 확인, 메뉴, 건물 출입 효과음

`python3 tralalerio/tools/build_music_assets.py /tmp/pokemon-gold-kr-research`가 `assets/audio/`에 웹용 악보와 출처 manifest를 만든다. 전체 자산 재생성에도 포함한다. 생성 후 `node scripts/sync-public.cjs`로 배포용 파일을 복사한다. 외부 음원 스트리밍·ROM은 필요하지 않다.

## 재생과 범위

`game-audio.js`는 원본 악보를 Web Audio PCM 버퍼로 합성한다. 펄스 2채널·웨이브·LFSR 노이즈, 주파수 레지스터·음량 엔벌로프·좌우 팬·비브라토와 채널별 인트로/루프 지점을 반영한다. 최근 두 곡만 합성 캐시에 남긴다. 음악 로드 실패나 오디오 미지원이 게임 진행을 막지 않는다.

원본의 음표·곡 구성·맵 배치는 사용하지만 게임보이의 사이클 단위 APU 에뮬레이션이나 실기 녹음은 아니다. 비브라토 보간, 엔벌로프 경계·위상·필터와 디지털 합성 음색은 실기와 차이가 있다. 포켓몬별 울음소리와 모든 기술·도구 효과음 전체는 이번 범위에 포함하지 않는다. 회복 기계와 공박사 전화는 기존 연출/음원을 유지하면서 전역 음소거·음량을 함께 적용한다. 회복 연출 중에는 배경음을 잠시 줄여 회복 음악과 겹치지 않게 한다.

iPad Safari 자동재생 정책에 따라 첫 터치나 키 입력에서 AudioContext를 활성화한다. 화면 아래 소리 토글·음량 슬라이더를 제공하며 `tralalerio-audio`에 설정만 저장한다. 모험 저장과 독립적이다. 탭을 숨기면 배경음악을 중단하고 돌아오면 현재 장면 음악을 재생한다.

검증:

- `cd tralalerio && node --test tests/game-audio.test.js tests/healing.test.js tests/phone-call.test.js`
- 서버 실행 후 `node tralalerio/tools/check-audio-browser.cjs`: Chrome·WebKit 첫 터치 재생, 음소거/음량 저장, 실제 필드·전투 종류별 전환
- 기존 `browser-healing.mjs`, `browser-phone-call.mjs` 회복/전화 연출 회귀

고동마을 믹스 변경: 사용자 요청으로 `Music_AzaleaTown`의 노이즈/드럼4번 채널만 생성에서 제외한다. 멜로디1~3번 채널과 나머지 지역 드럼은 유지한다. 전체 자산을 재생성해도 이 설정을 유지한다.

전 지역 드럼 제거: 고동마을뿐 아니라 모든 배경음악·조우·전투·승리 곡에서 드럼/노이즈4번 채널을 제외한다. 생성기와 재생기 양쪽에서 배경음악 드럼을 차단해 재생성·구형 자산에도 설정을 유지한다. 메뉴·확인·출입 등의 짧은 효과음은 별도이며 유지한다. 이 설정은 위의 고동마을 한정 변경보다 우선한다.

맵 전환 효과음 제거: 사용자 요청으로 건물·동굴 등 워프 시 출입 효과음(door/exit)을 재생하지 않고, 효과음 생성 목록에서도 제외한다. 맵별 음악 전환과 확인·메뉴 효과음은 유지한다.

소리 조작은 게임 메뉴 안의 켜기/끄기 버튼으로만 제공한다. 화면 아래 버튼·음량 슬라이더와 회복 화면의 별도 소리 버튼은 제거한다. 저장된 음소거 설정은 유지하며 기존 음량이0이면 소리를 켤 때 기본 음량으로 복구한다.
