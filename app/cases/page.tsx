import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "../info-page";
import { caseArticles } from "../lib/cases";

export const metadata: Metadata = {
  title: "사건 해설 | 오늘의 사기꾼",
  description: "《오늘의 사기꾼》에 열려 있는 사건마다 해당 사기 수법이 현실에서 어떻게 굴러가는지, 대화 중 무엇을 의심해야 하는지 정리한 해설 모음입니다.",
  alternates: { canonical: "/cases" },
};

export default function CasesPage() {
  return (
    <InfoPage
      current="/cases"
      eyebrow="CASE FILES"
      title="사건 해설"
      summary="게임에서 만나는 사기꾼들이 실제로 어떤 수법을 쓰는지 사건별로 풀어 썼습니다. 플레이 전에 읽어도 되고, 게임에서 한 번 털리고 나서 읽어도 됩니다. 순서는 후자가 더 잘 남습니다."
    >
      <section>
        <h2>왜 해설을 따로 두었나</h2>
        <p>게임 안에서는 설명을 최대한 줄였습니다. 교육 앱처럼 정답을 먼저 알려주면 상황극이 무너지기 때문입니다. 대신 대화가 끝난 뒤에 &ldquo;그래서 저게 뭐였지&rdquo; 하고 찾아볼 곳은 필요했고, 이 페이지가 그 자리입니다.</p>
        <p>각 해설은 세 부분으로 되어 있습니다. 그 수법이 현실에서 어떤 순서로 굴러가는지, 게임의 어느 대목에서 그 신호가 나오는지, 그리고 한 문장으로 요약하면 무엇인지입니다. 게임을 하지 않아도 읽을 수 있게 썼습니다.</p>
      </section>

      <section>
        <h2>열려 있는 사건 {caseArticles.length}건</h2>
        <ul className="case-index">
          {caseArticles.map((item) => (
            <li key={item.slug}>
              <Link href={`/cases/${item.slug}`}>
                <strong>CASE {item.no} · {item.title}</strong>
                <span>{item.type} · 상대 {item.scammer}</span>
                <em>{item.lead}</em>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>공통으로 통하는 것</h2>
        <p>수법은 제각각이지만 마지막에 하는 일은 같습니다. <strong>확인하지 못하게 만드는 것</strong>입니다. 비밀로 하라고 하거나, 시간이 없다고 하거나, 공식 경로를 쓰지 말자고 합니다. 그래서 상대가 누구든 확인을 막으려 든다면 그 순간이 가장 분명한 신호입니다.</p>
        <p>반대로 말하면 방어는 단순합니다. 전화를 끊고 공식 번호로 직접 걸기, 주변 사람 한 명에게 말하기, 하루 미루기. 이 세 가지 중 하나만 해도 대부분의 수법은 작동하지 않습니다.</p>
      </section>

      <section>
        <h2>가상 설정입니다</h2>
        <p>해설에 등장하는 인물, 계정, 기관, 금액은 모두 게임을 위해 만든 가상 설정입니다. 실제 인물이나 단체를 나타내지 않으며, 게임 안의 모든 송금은 게임 속 가상금액으로만 이루어집니다.</p>
        <p>실제 피해가 의심된다면 경찰(112)과 거래 금융기관 대표번호로 바로 연락하세요. 이 사이트는 신고나 상담을 대신하지 않습니다.</p>
      </section>
    </InfoPage>
  );
}
