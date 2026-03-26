import { ProtectedSurfaceFrame } from "@/components/auth/protected-surface-frame";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedSurfaceFrame surface="student">
      {children}
    </ProtectedSurfaceFrame>
  );
}
