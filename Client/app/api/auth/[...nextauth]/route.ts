import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, User } from "next-auth";
import axios from "axios"; // Use axios or fetch
import type { LoginPayload, AuthResponseData } from "@/lib/api/interfaces"; // Adjust import path

// Define the base URL for your backend API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const loginPayload: LoginPayload = {
          email: credentials.email,
          password: credentials.password,
        };

        try {
          // Call your backend login endpoint
          const response = await axios.post<AuthResponseData>(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/Auth/login`,
            loginPayload
          );

          const backendResponse = response.data;
          console.log("Backend response:", backendResponse, response.status);

          if (response.status === 200 && backendResponse.token) {
            // Return the user object expected by NextAuth
            // Include token and any other necessary user details here
            // These will be available in the JWT and session callbacks
            return {
              id: backendResponse.userId, // Ensure your backend returns user ID
              email: backendResponse.email,
              // name: backendResponse.user.userName, // Or another name field
              roles: backendResponse.roles, // Ensure backend returns roles
              accessToken: backendResponse.token,
              // Add other user properties if needed
            };
          } else {
            // Login failed
            console.error("Backend login failed:", backendResponse.message);
            // Throw an error or return null to indicate failure
            // You might want to throw a specific error message from the backend
            throw new Error(backendResponse.message || "Invalid credentials");
            // return null;
          }
        } catch (error: any) {
          console.error("Login error:", error.response?.data || error.message);
          // Extract message from Axios error if possible
          const errorMessage =
            error.response?.data?.message || error.message || "Login failed";
          throw new Error(errorMessage);
          // return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT strategy
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the access token and user roles to the JWT right after signin
      if (account && user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.roles = user.roles; // Add roles here
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user details from the token
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[]; // Add roles to session user
      }
      return session;
    },
    // async redirect({ url, baseUrl }) {
    //   // Allows relative callback URLs
    //   console.log("Redirect URL:", url, "Base URL:", baseUrl);
    //   if (url.startsWith("/")) return `${baseUrl}${url}`;
    //   // Allows callback URLs on the same origin
    //   else if (new URL(url).origin === baseUrl) return url;
    //   return baseUrl;
    // },
  },
  pages: {
    signIn: "/login", // Specify your custom login page
    // error: '/auth/error', // Optional: custom error page
  },
  // Add secret for production
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Extend the default Session and User types to include your custom properties
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      id?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    accessToken?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    roles?: string[];
  }
}
