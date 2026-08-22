import { createRoot } from "react-dom/client";
import TodayScammer from "../app/page";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("오늘의 사기꾼 앱 루트 요소를 찾지 못했습니다.");
}

createRoot(root).render(<TodayScammer />);
