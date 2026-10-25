# 마법영어 개발 기준

- 현재 실행 원본은 `magic-english/`, 배포 자산은 `public/magic-english/`다. 생성본을 직접 수정하지 않는다.
- 작업 전 저장소 `docs/MAGIC-ENGLISH-INTEGRATION.md`와 이 폴더의 Stage 1·2 문서를 확인한다.
- 모험·건축·음성·보상은 `/magic-english` 및 `/api/magic-english` 네임스페이스를 사용한다.
- 캐릭터 음성은 `character-voices.js`의 고정 배역과 정적 음성 파일을 사용한다. 기기 기본 음성으로 대체하지 않는다.
- `ELEVENLABS_API_KEY`는 서버 환경변수에서만 읽는다. 개인 파일·다른 프로젝트에서 키를 찾거나 공개 자산에 넣지 않는다.
- 배포 보상/동적 음성 캐시는 기존 Supabase `kv_store`를 사용한다. Vercel에서 로컬 파일·메모리만으로 영구 저장을 대체하지 않는다.
- 모험과 건축 저장 키, 지급 영수증, 개인 코드별 분리와 기존 건축을 유지한다.
- 부분 변경은 관련 단위 테스트만 실행한다. 이관·빌드 구조 변경은 `npm run build`로 확인한다. 전체 게임/브라우저 테스트는 사용자 요청 없이 실행하지 않는다.
- 원본 포켓몬 이력의 개발 지침은 `docs/LEGACY-AGENTS.md`에 보존한다. 현재 마법영어에 포획·수학 전투를 다시 넣지 않는다.
