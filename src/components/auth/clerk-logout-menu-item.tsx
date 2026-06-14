"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ClerkLogoutMenuItem({ onLocalLogout }: { onLocalLogout: () => void }) {
  const { signOut } = useClerk();
  return (
    <DropdownMenuItem
      className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
      onClick={async () => {
        await signOut();
        onLocalLogout();
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Log Out
    </DropdownMenuItem>
  );
}
