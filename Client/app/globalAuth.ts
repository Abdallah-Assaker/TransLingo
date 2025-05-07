// filepath: translator-client/auth.ts (Example - Create if it doesn't exist)
import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import your options defined in the route handler

// Export handlers for the API route, and the auth helper for server-side use
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
