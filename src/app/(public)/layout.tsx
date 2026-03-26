import { PublicShell } from "@/components/shells/public-shell";

export const revalidate = 300;

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicShell>{children}</PublicShell>;
}
