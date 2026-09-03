# 오늘의 사기꾼

수상한 사기꾼과 실제 메신저처럼 대화하고, 무너지는 논리 속에서 사기 신호를 찾아 탈출하는 모바일 웹게임입니다.

## 플레이 가능한 사건

- **CASE 01 · 억만장자가 20만원이 없대요** — 유명인 사칭
- **CASE 02 · 엄마가 갑자기 수술해야 한대요** — 소개팅 DM 로맨스스캠
- **CASE 06 · 해외 파병 군의관** — 해외 로맨스스캠

[게임 바로 플레이하기](https://today-scammer.vercel.app/)

## 주요 기능

- 길이에 따라 달라지는 타이핑 템포
- 매 장면 3개의 대화 선택지와 선택별 맞춤 반응
- 대화 중 수상한 단서를 채증해 의심력을 올리는 `사기 냄새` 기능
- 선택에 따라 달라지는 S / A / C / F 엔딩
- 플레이 후 사기 생존력과 능력치 결과
- 모든 송금과 금액은 게임 속 시뮬레이션이며 실제 금전 거래 없음

나머지 12개 케이스는 수배 목록에서 `에피소드 준비 중`으로 표시됩니다.

## 실행

Node.js 22 이상이 필요합니다.

```bash
pnpm install
pnpm dev
```

배포용 검증은 `pnpm build`, 서버 렌더링 점검은 `node --test tests/rendered-html.test.mjs`로 실행합니다.

## 광고 설정

광고는 웹과 토스 앱 모두 메인 화면과 결과 화면에만 표시되며, 브리핑과 채팅 플레이 화면에는 표시되지 않습니다. 웹은 AdSense 승인 후 `.env.example`을 참고해 게시자 ID와 홈·결과 광고 단위 슬롯 ID를 Vercel 환경변수에 등록합니다. 토스 앱은 공식 배너 SDK를 사용하며, 화면을 벗어나면 광고 슬롯을 즉시 제거합니다.

## Google Play 비공개 테스트

- 패키지 ID: `com.sbp37.todayscammer`
- 버전: `1.0` (`versionCode 1`)
- 테스트 번들: `deliverables/google-play/today-scammer-v1.0-closed-test.aab`
- 광고는 홈·결과 화면 배너와 다음 공개 사건을 여는 보상형 광고만 사용하며, 채팅 중에는 표시하지 않습니다.
- 영구 광고 제거 상품 ID는 `today_scammer_ad_free`입니다.

릴리스 AAB는 로컬 업로드 키로 서명됩니다. `android/signing/today-scammer-upload.jks`와 `android/keystore.properties`는 Git에서 제외되어 있으므로 두 파일을 반드시 함께 안전하게 백업해야 합니다. 어느 하나라도 분실하면 이후 업데이트 서명에 문제가 생길 수 있습니다.
