import { ClerkProvider } from "@clerk/nextjs";
import { ClerkSessionSync } from "./clerk-session-sync";

export function ClerkRuntimeProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return children;
  return (
    <ClerkProvider>
      <ClerkSessionSync />
      {children}
    </ClerkProvider>
  );
}
