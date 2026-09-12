import type { Metadata } from "next";
import { OpsView } from "./ops-view";

export const metadata: Metadata = {
  title: "오늘의 사기꾼 운영",
  robots: { index: false, follow: false },
};

export default function OpsPage() {
  return <OpsView />;
}
