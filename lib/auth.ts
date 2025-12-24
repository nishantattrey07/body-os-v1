import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Lazy load Prisma only when needed (server-side only)
function getPrismaAdapter() {
    // Dynamic import to avoid loading Prisma on client
    const { prisma } = require("./prisma");
    return PrismaAdapter(prisma);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: getPrismaAdapter(),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt", // JWT for client-side access without DB queries
    },
    callbacks: {
        async jwt({ token, user }) {
            // Add user ID to JWT token on sign in
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user ID to session from JWT
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    trustHost: true,
});
