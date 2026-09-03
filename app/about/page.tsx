import type { Metadata } from "next";
import { InfoPage } from "../info-page";

export const metadata: Metadata = {
  title: "게임 소개 | 오늘의 사기꾼",
  description: "오늘의 사기꾼은 수상한 상대와 대화하며 사기 신호를 찾아 탈출하는 짧은 모바일 상황극 게임입니다.",
};

export default function AboutPage() {
  return (
    <InfoPage eyebrow="ABOUT THE GAME" title="웃다가 한 번 더 의심하게 되는 게임" summary="《오늘의 사기꾼》은 여러 유형의 사기꾼과 메신저로 대화하고, 말 속의 모순과 압박을 찾아 빠져나오는 짧은 선택형 게임입니다.">
      <section>
        <h2>어떻게 플레이하나요?</h2>
        <p>사건파일에서 상대를 고르면 실제 메신저처럼 메시지가 한 줄씩 도착합니다. 매 상황에서 세 가지 답변 중 하나를 선택하고, 수상한 말이 등장했을 때 ‘사기 냄새 맡아보기’를 눌러 증거를 찾을 수 있습니다.</p>
        <p>정답표를 푸는 교육 앱처럼 보이기보다는, 상대의 말이 조금씩 무너지는 순간을 직접 발견하는 상황극을 목표로 합니다. 어떤 선택을 하느냐에 따라 S, A, C, F 네 가지 결과와 사기 생존력 점수가 달라집니다.</p>
      </section>
      <section>
        <h2>현재 열린 사건</h2>
        <ul>
          <li><strong>CASE 01</strong> 유명 테크 억만장자를 어설프게 사칭하는 ‘일런 모스크바’</li>
          <li><strong>CASE 02</strong> 평범한 소개팅 DM이 가족 위기와 송금 부탁으로 바뀌는 ‘J’</li>
          <li><strong>CASE 06</strong> 사랑과 고액 상자를 함께 보내겠다는 해외 파병 군의관 ‘Dr. 제임스 초이’</li>
        </ul>
      </section>
      <section>
        <h2>모든 돈은 가상금액입니다</h2>
        <p>게임 안에는 실제 송금, 결제, 금융 계좌 연결이 없습니다. 화면에 표시되는 금액과 송금 선택은 오직 이야기의 분기와 결과를 위한 게임 속 시뮬레이션입니다.</p>
        <p>등장인물, 프로필 이미지, 회사, 기관, 대화와 서류 역시 게임을 위해 만든 가상 설정입니다. 실제 인물이나 단체를 나타내지 않습니다.</p>
      </section>
    </InfoPage>
  );
}
