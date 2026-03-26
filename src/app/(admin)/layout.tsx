import { ProtectedSurfaceFrame } from "@/components/auth/protected-surface-frame";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedSurfaceFrame surface="admin">
      {children}
    </ProtectedSurfaceFrame>
  );
}
