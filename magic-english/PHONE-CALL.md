# 알 심부름 뒤 공박사의 전화

2026-10-17, pret/pokegold의 원본 역어셈블 스크립트를 확인했다.

- [포켓몬 할아버지 집](https://github.com/pret/pokegold/blob/master/maps/MrPokemonsHouse.asm): 알·도감 이벤트 뒤 `SPECIALCALL_ROBBED`를 예약한다.
- [전화 엔진](https://github.com/pret/pokegold/blob/master/engine/phone/phone.asm): 야외에서 30프레임 대기 후 `RingTwice_StartCall`. 화면 맨 위 발신자 상자에서 20프레임 간격으로 이름을 두 차례 점멸하고, 통화 대사·버튼 대기 뒤 `HangUp`과 말줄임표 세 번으로 끝난다. 포켓기어 전체 메뉴를 여는 흐름이 아니다.
- [공박사 대사](https://github.com/pret/pokegold/blob/master/data/phone/text/elm.asm): 당황한 박사가 큰일이 났으니 즉시 연구소로 돌아오라고 요청한다. 도난의 구체적 설명은 연구소 이벤트에서 이어진다.
- [효과음](https://github.com/pret/pokegold/blob/master/audio/sfx.asm): CALL의 1952 피치 레지스터 반복과 HANG_UP의 1915 레지스터를 참고해 Web Audio 사각파로 재생한다. ROM 오디오 재생이나 하드웨어 음원 전체 에뮬레이션은 아니다. 브라우저 정책상 사용자 입력 후 소리를 낼 수 있다.

`phone-call.js`가 착신 → 통화 → 종료를 처리한다. 집에서 알을 받고 30번 도로로 나왔을 때 시작하며, 예전 미완료 저장은 30번 도로에서 재개한다. `state.phoneCall`에 phase·page를 저장한다. 통화 중에는 이동·메뉴·파티·재시작·불러오기를 막고 대화 다음 버튼만 진행한다. 마지막 종료 연출 후에만 `flags.labCall`을 설정해 반복 발신과 스토리 누락을 막는다. 새로고침하면 착신/종료는 해당 연출부터, 통화는 읽던 페이지부터 복원한다. 알·파티·볼·턴은 바꾸지 않는다.

검증: `phone-call.test.js`의 마커 검증·저장·이동 잠금과 `browser-phone-call.mjs`의 Chromium·WebKit iPad 실제 집 출구·착신·통화·종료 및 각 단계 새로고침. 원본 알 배달 전체 동선은 `browser-egg-mission.mjs`에서 이어서 검사한다.
