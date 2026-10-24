# 마법한자 PoC

2026-10-09. 1인 웹 카드 모험의 첫 챕터 ‘잠든 숲의 정령들’.

## 실행

`npm run dev` 후 `/hanja`에서 체험한다. 등록된 사용자의 게임 선택 화면에 마법한자가 추가되며 `/{userId}/hanja`로 이동한다. 정적 서버에서는 `/hanja/`로 실행할 수 있다.

## 모험

火·水 두 카드로 출발한다. 火로 동굴을 밝히고 보물상자에서 나침반을 찾는다. 水로 연못을 복구하면 木 정령과 친구가 된다. 고목에서 水 → 木 순서로 길을 만들고 수호자를 만난다. 전투에서 水는 덩굴을 느슨하게 하고 다음 火의 피해를 2에서 4로 올린다. 木은 피해 1과 다음 적 행동 방어를 제공한다. 수호자의 덩굴 9를 풀면 風 카드를 얻는다. 언덕에서 風으로 안개를 걷고 月 정령을 얻은 후, 고목으로 돌아와 月로 숲을 깨운다. 새 카드를 모을수록 탐험 장소가 열린다.

글자·뜻·음은 카드 및 도감에서 분리해서 표시한다. 마법 발동 시 음과 뜻을 번갈아 회상한다. 오답이나 도움 사용 뒤의 성공은 학습 숙련 횟수에 합산하지 않는다. 독립 정답 2회 이후 선택한 손패의 그림과 설명을 접어 글자 인식을 유도하고, 3회 이후 각성 표시를 제공한다. 이 수치는 PoC용이며 실제 학습 성취 판정이 아니다.

저장은 `magic-hanja-v1:{userId}`이며 체험판은 `guest`를 사용한다. 전투와 진행도 새로고침 후 복원된다. 기기 간 동기화는 없다. 저장소가 막히면 메모리에서 계속 플레이하며 저장 불가를 표시한다. 효과음과 주문 듣기, 동작 줄이기를 지원한다. 음성 지원은 브라우저에 따라 다르다.

## 이미지

내장 image_gen 도구와 imagegen 스킬로 원본 정령 일러스트를 생성했다. 프로젝트에 저장한 최종 에셋: `hanja/assets/spirits.jpg`; 실행용 사본: `public/hanja/assets/spirits.jpg`. 하나의 3×2 아틀라스를 CSS 배경 위치로 표시하며 한자와 UI는 실제 텍스트로 겹친다.

아래 프롬프트를 사용했다:

> Use case: illustration-story. Asset type: illustrated asset atlas for a children's browser fantasy adventure card game. Create one landscape image 1536x1024, precisely divided into a 3-column by 2-row grid of six equally sized rectangular paintings, no gutters. Top left: beautiful enchanted forest clearing with ancient enormous sleeping tree, turquoise pond, winding path and tiny glowing fireflies, environment only. Top middle: adorable tiny fire fox spirit with flaming tail in amber woodland, full body centered. Top right: adorable blue water otter spirit in turquoise pond full body centered. Bottom left: adorable sapling deer spirit with leafy antlers in green woodland full body centered. Bottom middle: adorable wind bird spirit with ivory feathers and teal swirling winds full body centered. Bottom right: adorable moon rabbit spirit with crescent glow in midnight woodland full body centered. Cohesive premium hand-painted storybook game art, painterly rich textures, magical soft lighting, lush detailed foliage, appealing expressive creatures, sophisticated warm cream and teal palette. Each panel has independent edge-to-edge backdrop and generous breathing room around subject suitable for cropping as a card illustration. No text, no lettering, no borders, no logos, no UI. Original character designs.

## 검증과 범위

`npm run build`, `node tests/hanja.cjs`, `node tests/hanja-routes.cjs`. 브라우저 테스트 기본 주소는 `http://localhost:4188/hanja/`이며 `HANJA_TEST_URL`로 변경한다. 테스트는 실제 터치/클릭으로 카드 발동, 오답 후 숙련 제한, 선행 마법, 전투 연계, 5장 수집, 완주, 저장 복원, 도감, 모바일 넘침, 사용자 분리와 저장소 실패를 확인한다. 라우트 테스트는 임시 디렉터리의 독립 사용자 저장소에서 개인 주소와 이름 이스케이프, 게임 로비, 알 수 없는 사용자 404 및 HTML 빌드 추적을 검증한다.

PoC는 4개 탐험 장소·5장·수호자 전투 1종이다. 자유 이동 월드와 무작위 덱 뽑기는 포함하지 않으며, 장소 선택과 장면 속 대상 클릭으로 진행한다. 보물과 도감은 이 게임 안에서 관리하며 공통 배지 서버에는 연결하지 않는다. 카드는 마법천자문의 원본 이미지나 특정 권의 카드 목록을 복제하지 않았다.


## 화면 개편 · 정령의 서

참고 이미지의 구성을 반영해 전체 화면 마법 서재, 캐릭터 루미, 금빛 HUD와 하단 메뉴, 장면별 탐험 배경, 카드 목록과 상세 패널이 나뉜 도감으로 개편했다. `마법 서재 / 숲 탐험 / 정령 도감 / 모험 기록 / 새 모험 / 게임 마을`은 실제 동작한다. 숫자는 수집 기록에서 계산하며, 재화나 접속자 수처럼 게임에 없는 수치를 표시하지 않는다.

도감의 첫 5장은 이번 모험의 실제 카드이며 뒤 15장은 다음 이야기의 미리보기다. 미리보기는 수집 현황 분모에 포함하지 않고 잠금과 다음 이야기 문구를 표시한다. 다음 이야기의 지도/전투는 구현되어 있지 않다.

기존 진행과 카드 기록은 그대로 읽는다. 서재에서 모험을 이어갈 수 있으며 모바일에서는 화면을 세로로 배치하고 손패를 가로로 스크롤한다. `node tests/hanja-layout.cjs`는 낮은 데스크톱 화면, iPad 가로/세로, 휴대폰의 전투 대상 선택과 도감 배치를 검증한다.

내장 image_gen 도구로 생성한 추가 에셋과 최종 프롬프트:

- `hanja/assets/sanctuary.jpg`

  > Use case: stylized-concept. Asset type: full-screen 16:9 background for a premium Korean fantasy collectible card browser game for a child. A breathtaking magical card collector's sanctuary inside an ancient forest tree, lavish circular wooden library, tall shelves overflowing with glowing ornate spell cards, golden filigree, emerald crystals, floating warm motes, velvet midnight teal fabrics, large round arched windows opening onto luminous enchanted forest, massive tree roots integrated into polished wooden floor, reading desk, magical globe, luminous circular summoning sigil on floor in center-right. Luxurious detailed hand-painted anime RPG environment illustration, cinematic depth, sumptuous warm amber lighting with blue teal shadows, inviting magical adventure atmosphere. Full-bleed wide composition, foreground depth. Leave center-right floor open for a character overlay, keep darker negative space along left for UI. No people, no text, no logos, no UI, no letters. High production value.

- `hanja/assets/worlds.jpg`

  > Use case: stylized-concept. Asset type: environment atlas for a premium children's fantasy card adventure. One wide landscape image divided precisely into a 2 by 2 grid of four equal independent landscape scenes without gutters. TOP LEFT: mysterious cavern inside an enormous forest tree, glowing mushrooms, a prominent unlit brass lantern hanging near center and a closed ornate treasure chest to its right, dim blue teal light, old stone steps. TOP RIGHT: enchanted woodland pond surrounded by stones and willows, beautiful waterfall, turquoise magical spring and small deer shrine to right, golden sunbeams. BOTTOM LEFT: enormous ancient sentient forest tree with peaceful carved face, broad twisting roots and natural stairway rising along right side, glowing seed at trunk, emerald twilight. BOTTOM RIGHT: high forest hill at night with ruins, moonlit silver mist, crescent moon and rabbit shrine on right, purple blue stars. All scenes polished painterly anime RPG background art, lush highly detailed textures, gold teal violet light, cinematic composition and depth. No characters, no UI, no text, no panel borders. Each environment must fill its entire equal quadrant.

- `hanja/assets/guide.png`

  > Use case: stylized-concept. Asset type: full-body fantasy RPG guide character PNG cutout. Original friendly young adult female forest archivist mage for a children's fantasy game, full body including feet and hair, long ivory silver hair, warm kind expression, emerald eyes, tasteful modest layered ivory and midnight teal long mage dress, ornate gold embroidered mantle, belt with small glowing jade crystal, leather ankle boots, pointed elegant wizard hat with little leaf brooch, holds an ornate closed magical card book in left hand and extends right hand welcoming the player. Premium detailed hand-painted anime character art, clean elegant silhouette, warm rim light, painterly gradients and material detail, 3/4 front view, straight standing pose. Character centered with full-body breathing room, truly transparent background, no scene, no pedestal, no cast ground shadow, no text, no logo. Family-friendly, modest attire. No other people.

- `hanja/assets/next-spirits.jpg`

  > Use case: stylized-concept. Asset type: 15 fantasy collectible card artwork atlas for a premium children's browser game. Create a landscape image arranged in exactly FIVE COLUMNS and THREE ROWS of equally sized vertical-ish panels with NO gaps or borders. Each panel is an independent original fantasy spirit creature illustration, highly detailed painterly anime trading-card art, magical effects, jewel colors, elaborate fantasy environment, adorable yet majestic creatures, full subject visible. Row 1 left to right: mountain horned ram with misty mountains; ancient stone turtle with glowing runes; rain frog with sparkling rain; cloud whale floating in sky; golden sun lion glowing with rays. Row 2: sky phoenix blue cosmic wings; enormous gentle giant bear among miniature trees; tiny mouse among huge flowers; ascending golden crane amid floating stairs; descending dark blue manta ray under waterfalls. Row 3: brave forest knight with full modest armor; singing songbird with luminous sound waves; owl with luminous eye magic; fennec fox with large magical ears; heart-shaped pink crystal deer with warm healing aura. All original designs in cohesive luminous rich emerald blue gold violet fantasy aesthetic, premium painted texture. No letters, no words, no numbers, no UI, no logos. Exactly 15 equal panels, precisely tiled 5x3.

실행용 사본은 `public/hanja/assets/`에 동기화한다. 탐험 장소는 `worlds.jpg`의 독립적인 네 장면을 사용한다. 최종 안내 캐릭터는 최초 생성한 투명 PNG를 사용한다.


