import Link from "next/link";

const links = [
  { href: "/", label: "게임" },
  { href: "/about", label: "소개" },
  { href: "/guide", label: "플레이 방법" },
  { href: "/cases", label: "사건 해설" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보" },
];

/** Plain text links, rendered on the server so crawlers follow them without running anything. */
export function SiteNav({ current, placement = "top" }: { current?: string; placement?: "top" | "bottom" }) {
  return (
    <nav className={`site-nav site-nav-${placement}`} aria-label="사이트 메뉴">
      {links.map((link) => (
        link.href === current
          ? <span key={link.href} aria-current="page">{link.label}</span>
          : <Link key={link.href} href={link.href}>{link.label}</Link>
      ))}
    </nav>
  );
}
