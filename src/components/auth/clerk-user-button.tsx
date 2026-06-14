"use client";

import { Show, UserButton } from "@clerk/nextjs";

export function ClerkUserButton() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return (
    <Show when="signed-in">
      <UserButton />
    </Show>
  );
}
