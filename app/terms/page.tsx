import type { Metadata } from "next";
import { InfoPage } from "../info-page";

export const metadata: Metadata = {
  title: "이용안내 및 약관 | 오늘의 사기꾼",
  description: "오늘의 사기꾼 웹게임의 이용 조건과 가상금액 안내입니다.",
};

export default function TermsPage() {
  return (
    <InfoPage eyebrow="PLAYER RULES" title="이용안내 및 약관" summary="게임을 시작하기 전에 이것만은 확실합니다. 화면 속 송금은 전부 가상이고, 현실의 돈은 한 푼도 움직이지 않습니다.">
      <section>
        <h2>1. 서비스 성격</h2>
        <p>오늘의 사기꾼은 사기 수법을 소재로 만든 선택형 상황극 게임입니다. 제공되는 대사와 결과는 일반적인 정보이며, 특정 상황에 대한 법률·금융·수사 자문을 대신하지 않습니다.</p>
      </section>
      <section>
        <h2>2. 가상금액과 결제</h2>
        <p>게임에 표시되는 모든 금액은 게임 속 가상금액입니다. 가상 송금 버튼을 눌러도 실제 송금, 결제, 계좌 연결 또는 금전 거래가 발생하지 않습니다.</p>
        <p>단, Android 앱에서 별도로 표시되는 <strong>광고 영구 제거</strong>는 Google Play를 통해 실제 결제가 이루어지는 일회성 디지털 상품입니다. 게임 속 가상 송금과는 명확히 구분되며, 결제 화면에서 가격과 상품 내용을 다시 확인할 수 있습니다.</p>
        <p>광고 제거를 구매하면 현재 및 향후 공개되는 사건을 배너·보상형 광고 없이 플레이할 수 있습니다. 아직 제작 중인 사건의 출시 시점이나 제공 자체를 구매하는 상품은 아니며, 환불과 결제 취소는 Google Play 정책을 따릅니다.</p>
      </section>
      <section>
        <h2>3. 가상 등장인물</h2>
        <p>등장인물과 프로필 이미지는 게임을 위해 제작한 가상 캐릭터입니다. 이름, 회사, 기관, 자격증, 메시지와 사건은 실제 인물이나 단체와 관련이 없습니다.</p>
      </section>
      <section>
        <h2>4. 이용 시 주의사항</h2>
        <p>게임의 화면, 대사, 이미지와 코드를 권리자의 허락 없이 재판매하거나 다른 서비스의 공식 자료인 것처럼 사용할 수 없습니다. 서비스에 비정상적인 부하를 주거나 진행 데이터를 조작하는 행위도 제한될 수 있습니다.</p>
      </section>
      <section>
        <h2>5. 서비스 변경과 문의</h2>
        <p>에피소드, 기능과 운영 방식은 더 나은 플레이 경험을 위해 변경될 수 있습니다. 오류 신고와 이용 문의는 <a href="https://github.com/sbp37/today-scammer/issues" target="_blank" rel="noreferrer">공식 GitHub 문의 창구</a>에서 받습니다.</p>
        <p><strong>시행일: 2026년 9월 1일</strong></p>
      </section>
    </InfoPage>
  );
}
