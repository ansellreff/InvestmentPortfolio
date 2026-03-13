/**
 * NextAuth configuration for authentication
 * This file contains only edge-compatible configuration
 */

import type { NextAuthConfig } from "next-auth"

export const authConfig: Partial<NextAuthConfig> = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      // Pass user data from token to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.image as string | null
      }
      return session
    },
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
