import type { Metadata } from "next";
import { InfoPage } from "../info-page";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 오늘의 사기꾼",
  description: "오늘의 사기꾼 서비스의 개인정보 처리, 광고 SDK와 기기 저장 정보 안내입니다.",
};

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="PRIVACY FILE" title="개인정보처리방침" summary="오늘의 사기꾼은 회원가입 없이 플레이할 수 있으며, 게임 속 답변에 실제 개인정보를 입력받지 않습니다.">
      <section>
        <h2>1. 수집하는 정보</h2>
        <p>현재 서비스는 이름, 전화번호, 주소, 계좌번호와 같은 개인정보를 직접 입력받거나 별도의 회원 계정을 만들지 않습니다.</p>
        <p>서비스 안정성과 보안을 위해 호스팅 사업자가 접속 시간, 브라우저 종류, 기기 정보, IP 주소와 같은 일반적인 접속 기록을 자동으로 처리할 수 있습니다.</p>
      </section>
      <section>
        <h2>2. 기기에 저장되는 정보</h2>
        <p>튜토리얼 중복 노출을 막거나 게임 진행 경험을 유지하기 위해 브라우저의 로컬 저장소를 사용할 수 있습니다. 이 정보는 사용자의 기기에 저장되며, 브라우저 설정에서 삭제할 수 있습니다.</p>
      </section>
      <section>
        <h2>3. 공유 기능</h2>
        <p>결과 공유 버튼은 브라우저 또는 운영체제의 공유 기능을 호출합니다. 공유할 앱과 상대는 사용자가 직접 선택하며, 서비스가 연락처 목록이나 메시지 내용을 수집하지 않습니다.</p>
      </section>
      <section>
        <h2>4. 광고와 쿠키</h2>
        <p>웹 광고가 활성화될 경우 Google AdSense 등 광고 제공자가 광고 제공, 빈도 관리, 부정 사용 방지와 성과 측정을 위해 쿠키 또는 유사 식별자를 사용할 수 있습니다. Android 앱에서는 Google Mobile Ads SDK를 사용해 메인·결과 화면의 배너 광고와 사용자가 직접 선택한 보상형 광고를 제공할 수 있습니다.</p>
        <p>Google Mobile Ads SDK는 광고 제공, 분석과 부정 사용 방지를 위해 IP 주소로 추정한 대략적인 위치, 앱 실행·탭·광고 시청과 같은 앱 상호작용, 앱 및 SDK 진단정보, 광고 ID·앱 세트 ID와 같은 기기 식별자를 자동으로 수집하거나 Google과 공유할 수 있습니다. 전송되는 정보는 전송 구간에서 암호화됩니다.</p>
        <p>관련 정보와 광고 개인 최적화 설정은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">Google 광고 정책</a>에서 확인할 수 있습니다. 필요한 지역에서는 동의 관리 화면을 제공합니다.</p>
      </section>
      <section>
        <h2>5. Google Play 결제</h2>
        <p>Android 앱의 광고 제거 상품은 Google Play 결제 시스템을 통해 처리됩니다. 서비스는 광고 제거 권한 확인을 위해 상품 식별자, 구매 상태와 구매 복원 결과를 확인할 수 있지만 카드번호나 결제수단 정보를 직접 수집하거나 저장하지 않습니다.</p>
        <p>기기에는 광고 제거 권한의 빠른 적용을 위한 상태값이 저장될 수 있으며, 실행 시 Google Play 구매 내역과 대조해 구매·환불 상태를 복원합니다.</p>
      </section>
      <section>
        <h2>6. 문의 및 변경</h2>
        <p>개인정보 관련 문의는 <a href="https://github.com/sbp37/today-scammer/issues" target="_blank" rel="noreferrer">공식 GitHub 문의 창구</a>를 이용할 수 있습니다. 정책이 변경되면 이 페이지의 시행일과 내용을 갱신합니다.</p>
        <p><strong>시행일: 2026년 9월 1일</strong></p>
      </section>
    </InfoPage>
  );
}
