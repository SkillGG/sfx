import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { object, string } from "zod/v4-mini";
import { getRandomWordString } from "@/utils/utils";
import { type PrismaClient } from "@prisma/client";

export const refreshSession = async (db: PrismaClient, dname: string) => {
  const updateDate = new Date();

  const updated = await db.userSession.update({
    where: { username: dname.trim() },
    data: { lastUpdatedAt: updateDate },
    select: { lastUpdatedAt: true },
  });

  if (updated?.lastUpdatedAt?.getTime() === updateDate.getTime()) {
    return true;
  } else return { err: "Could not refresh!" };
};

export const checkSession = async (
  db: PrismaClient,
  auth: { token: string; deviceName: string },
): Promise<{ ok: true } | { ok: false; err: string; errcode: string }> => {
  const { token, deviceName } = auth;

  console.log("Checking if ", deviceName, " is logged in with token: ", token);
  if (!token) return { ok: false, err: "No token?", errcode: "INVALID_TOKEN" };

  const userToken = await db.userSession.findFirst({
    where: { token, username: deviceName },
  });

  if (!userToken)
    return {
      ok: false,
      err: "Something went wrong!",
      errcode: "UNDEFINED",
    };

  const tokenExpiry = userToken.lastUpdatedAt.getTime() + userToken.maxTime;

  if (tokenExpiry < Date.now()) {
    console.log("Session timed out");
    return {
      ok: false,
      err: "Session expired! Please log in again!",
      errcode: "SESSSION_EXPIRED",
    };
  }

  console.log(
    "Loggin in as ",
    userToken.username,
    "exipres:",
    new Date(tokenExpiry),
    tokenExpiry > Date.now() ? ">" : "<",
    "now",
    new Date(),
  );
  console.log(
    "refreshing ",
    deviceName,
    "'s session: ",
    await refreshSession(db, deviceName),
  );

  return { ok: true };
};

export const userRouter = createTRPCRouter({
  checkLogin: publicProcedure
    .input(object({ token: string(), deviceName: string() }))
    .query(async ({ ctx, input }) => {
      return await checkSession(ctx.db, input);
    }),
  refreshSessionTimer: publicProcedure
    .input(object({ deviceName: string() }))
    .mutation(async ({ input: { deviceName }, ctx }) => {
      console.log(
        `refreshing ${deviceName}'s session: `,
        await refreshSession(ctx.db, deviceName.trim()),
      );
      return true;
    }),
  logIn: publicProcedure
    .input(object({ pass: string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.pass === env.CREATOR_PASSWORD) {
        const session = await ctx.db.userSession.create({
          data: {
            maxTime: 60 * 60 * 1000,
            username: getRandomWordString().trim(),
          },
          select: { token: true, username: true },
        });

        return {
          token: `${session.token}`,
          deviceName: session.username,
        };
      } else {
        return false;
      }
    }),
});
