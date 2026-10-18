# 메뉴 지도

메뉴 → 지도 보기에서 성도·관동 지도를 연다. 골드 원본의 타일 이미지, 20×18 배치, 타일별 팔레트, 94개 지명과 좌표를 변환한다. 현재 실행 가능한 46개 맵은 원본 `LANDMARK_*`에 연결하므로 집·체육관·센터 내부, 동굴의 지하층에서도 해당 지역을 표시한다.

현재 위치는 원본 주인공 스프라이트로 표시한다. 선택 지점은 원본 포켓기어 커서로 표시하며 ↑↓ 또는 이전/다음으로 지명 순서대로 이동한다. 지도 터치는 가장 가까운 지점을 고르고, 장소 선택 상자·성도/관동·내 위치 버튼은 웹 터치 조작을 위해 추가했다. B/X/Esc 또는 닫기로 메뉴로 돌아간다. 지도 조회는 모험 저장·좌표·턴을 변경하지 않는다. 공중날기나 미구현 지역 이동 기능은 포함하지 않는다. 지도 카드 획득을 요구하지 않고 메뉴에서 바로 열 수 있게 한 것은 사용자 요청에 따른다.

원본 자료는 `https://github.com/Narishma-gb/pokegold-kr`, 고정 커밋 `c90f31dadef17f033a8f1bdada701b26cef18241`이다.

- `gfx/pokegear/town_map.png`, `johto.bin`, `kanto.bin`
- `gfx/pokegear/pokegear.pal`, `town_map_palette_map.asm`, `pokegear_sprites.png`
- `data/maps/landmarks.asm`, `constants/landmark_constants.asm`, `data/maps/maps.asm`
- `engine/pokegear/pokegear.asm`: 현재 위치 및 지역·지명 커서 규칙

생성: `python3 tralalerio/tools/build_town_map.py /tmp/pokemon-gold-kr-research` 후 `node scripts/sync-public.cjs`. 전체 재생성에도 포함한다.

검증: `cd tralalerio && node --test tests/town-map.test.js`; 서버 실행 후 `node tralalerio/tools/check-town-map-browser.cjs`에서 Chrome·WebKit 터치/키보드·모바일·저장 보존을 확인한다.
