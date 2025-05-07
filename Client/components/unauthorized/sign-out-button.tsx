'use client'; // Mark as a Client Component

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react'; // Optional: Add an icon

/**
 * Renders a button that signs the user out when clicked.
 */
export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' }); // Redirect to home page after sign out
  };

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" /> {/* Optional Icon */}
      Sign Out
    </Button>
  );
}
