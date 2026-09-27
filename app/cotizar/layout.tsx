import type { Metadata } from "next";

// Quote flow screens: personal to each user, never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function QuoteLayout({ children }: LayoutProps<"/cotizar">) {
  return children;
}
