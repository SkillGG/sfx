import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { object, string } from "zod/v4-mini";
import { getRandomWordString } from "@/utils";

export const userRouter = createTRPCRouter({
  checkLogin: publicProcedure
    .input(object({ token: string(), deviceName: string() }))
    .query(async ({ ctx, input: { token, deviceName } }) => {
      console.log(
        "Checking if ",
        deviceName,
        " is logged in with token: ",
        token,
        "is logged in",
      );
      if (!token) return { ok: false, err: "No token?" };

      const userToken = await ctx.db.userSession.findFirst({
        where: { token, username: deviceName },
      });

      console.log(userToken);

      if (!userToken)
        return {
          ok: false,
          err: "Something went wrong!",
          errcode: "UNDEFINED",
        };

      const tokenExpiry = userToken.createdAt.getTime() + userToken.maxTime;

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
        userToken,
        tokenExpiry,
        tokenExpiry > Date.now() ? ">" : "<",
        Date.now(),
        new Date(),
        new Date(tokenExpiry),
      );

      return { ok: true };
    }),
  logIn: publicProcedure
    .input(object({ pass: string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.pass === env.CREATOR_PASSWORD) {
        const session = await ctx.db.userSession.create({
          data: { maxTime: 60 * 60 * 1000, username: getRandomWordString() },
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
