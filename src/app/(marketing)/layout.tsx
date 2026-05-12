import { PublicTopBar } from "@/components/layout/public-topbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PublicTopBar />
      <main>{children}</main>
    </div>
  );
}
