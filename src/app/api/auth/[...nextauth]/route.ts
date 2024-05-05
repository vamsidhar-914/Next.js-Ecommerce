import db from "@/db/db";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { notFound } from "next/navigation";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        username: { label: "email", type: "text", placeholder: "" },
        password: { label: "password", type: "password", placeholder: "" },
      },
      async authorize(credentials: any) {
        const username = credentials.username;
        const password = credentials.password;
        const findUser = await db.user.findUnique({
          where: {
            email: username,
          },
        });
        if (findUser == null) return null;
        return {
          id: findUser.id,
        };
      },
    }),
  ],
});

export const GET = handler;
export const POST = handler;
