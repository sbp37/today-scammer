import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoPage } from "../../info-page";
import { caseArticles, findCaseArticle } from "../../lib/cases";

export function generateStaticParams() {
  return caseArticles.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = findCaseArticle(slug);
  if (!article) return { title: "사건 해설 | 오늘의 사기꾼" };
  return {
    title: `CASE ${article.no} ${article.title} 해설 | 오늘의 사기꾼`,
    description: `${article.type} 수법이 현실에서 어떻게 굴러가는지, 게임 속 ${article.scammer}와의 대화에서 무엇을 의심해야 하는지 정리했습니다.`,
    alternates: { canonical: `/cases/${article.slug}` },
  };
}

export default async function CaseArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = findCaseArticle(slug);
  if (!article) notFound();

  const others = caseArticles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <InfoPage
      current="/cases"
      eyebrow={`CASE ${article.no} · ${article.type}`}
      title={article.title}
      summary={article.lead}
    >
      <section>
        <h2>이 수법은 현실에서 이렇게 굴러갑니다</h2>
        {article.realWorld.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <section>
        <h2>게임에서는 여기를 의심하세요</h2>
        <p>상대는 <strong>{article.scammer}</strong>입니다. 대화 중 아래 장면이 나오면 <strong>사기 냄새 맡아보기</strong>를 눌러볼 때입니다.</p>
        <ul>
          {article.inGame.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p className="case-tell">{article.tell}</p>
      </section>

      <section>
        <h2>한 가지만 기억한다면</h2>
        <p>이 수법에 당하는 것은 부주의해서가 아닙니다. 모든 사기는 확인할 시간을 빼앗는 방식으로 설계되어 있고, 그 설계는 똑똑한지 아닌지와 거의 상관없이 작동합니다. 웃기는 건 사기꾼이지 피해자가 아닙니다.</p>
        <p>실제 피해가 의심된다면 경찰(112)과 거래 금융기관 대표번호로 바로 연락해 지급정지를 요청하세요. 이 사이트는 신고나 상담을 대신하지 않습니다.</p>
      </section>

      <section>
        <h2>가상 설정 안내</h2>
        <p>{article.scammer}를 비롯한 등장인물, 프로필 이미지, 회사, 기관, 계좌번호, 서류는 모두 게임을 위해 만든 가상 설정입니다. 실제 인물이나 단체를 나타내지 않습니다. 게임 안의 모든 송금은 게임 속 가상금액으로만 이루어지며 실제 금전 거래는 없습니다.</p>
      </section>

      <section>
        <h2>다른 사건 해설</h2>
        <ul className="case-more">
          {others.map((item) => (
            <li key={item.slug}>
              <Link href={`/cases/${item.slug}`}>CASE {item.no} · {item.title}</Link>
              <span>{item.type}</span>
            </li>
          ))}
          <li><Link href="/cases">사건 해설 전체 보기</Link></li>
        </ul>
      </section>
    </InfoPage>
  );
}
