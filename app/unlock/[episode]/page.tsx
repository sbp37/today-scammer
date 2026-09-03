import { notFound } from "next/navigation";
import { AdBanner } from "../../components/ad-banner";
import { TodayScammer, type CaseId } from "../../page";

const rewardedCases = new Set<CaseId>(["ep02", "ep03", "ep06"]);

export default async function RewardedEpisodePage({ params }: { params: Promise<{ episode: string }> }) {
  const { episode } = await params;
  if (!rewardedCases.has(episode as CaseId)) notFound();

  return (
    <TodayScammer
      initialCaseId={episode as CaseId}
      initialScreen="briefing"
      unlockArrival
      homeAd={<AdBanner placement="home" />}
      resultAd={<AdBanner placement="result" />}
    />
  );
}
