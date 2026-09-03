import type { Metadata } from "next";
import { InfoPage } from "../info-page";

export const metadata: Metadata = {
  title: "문의 및 오류 제보 | 오늘의 사기꾼",
  description: "오늘의 사기꾼 오류 제보, 콘텐츠 및 개인정보 문의 창구입니다.",
};

export default function ContactPage() {
  return (
    <InfoPage eyebrow="OPEN A TICKET" title="수상한 버그를 발견했나요?" summary="대화가 갑자기 끊기거나 선택지가 앞말과 맞지 않는다면, 그건 사기 수법이 아니라 고쳐야 할 버그입니다.">
      <section>
        <h2>문의할 수 있는 내용</h2>
        <ul>
          <li>대화와 선택지가 자연스럽게 이어지지 않는 문제</li>
          <li>모바일에서 버튼이나 메시지가 겹치는 문제</li>
          <li>이미지 로딩, 공유, 뒤로가기 오류</li>
          <li>개인정보, 콘텐츠 권리 및 서비스 운영 관련 문의</li>
        </ul>
      </section>
      <section>
        <h2>공식 문의 창구</h2>
        <p><a className="info-action" href="https://github.com/sbp37/today-scammer/issues" target="_blank" rel="noreferrer">GitHub에서 문의 남기기 ↗</a></p>
        <p>오류 제보 시 사용한 기기, 브라우저, 사건 번호와 문제가 발생한 대사를 함께 적어주면 확인이 빨라집니다. 계좌번호, 전화번호와 같은 실제 개인정보는 작성하지 마세요.</p>
      </section>
    </InfoPage>
  );
}
