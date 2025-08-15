"use client";

import { api } from "@/trpc/react";
import { cn } from "@/utils";
import { useState } from "react";
import { useDarkMode } from "../hooks/darkmode";
import DarkModeSwitch from "../_components/darkModeSwitch";

const LoginPage = () => {
  const [pass, setPass] = useState<string>("");
  const login = api.user.logIn.useMutation();

  const { mode } = useDarkMode();

  const [err, setError] = useState("");

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-slate-100",
        "dark:bg-slate-900",
        mode,
      )}
    >
      <form
        className={cn(
          "flex flex-col rounded-xl border border-slate-300 bg-white px-8 py-8",
          "shadow-lg dark:border-slate-700 dark:bg-slate-800",
        )}
        onSubmit={async (e) => {
          e.preventDefault();
          const loginSuccess = await login.mutateAsync({ pass });
          if (loginSuccess) {
            sessionStorage.setItem("stk", loginSuccess.token);
            sessionStorage.setItem("dnam", loginSuccess.deviceName);
            window.location.reload();
          } else {
            setError("Wrong password!");
          }
        }}
      >
        <label className={cn("flex flex-col gap-2")}>
          <div
            className={cn(
              "mb-0",
              "text-base font-medium text-slate-700 dark:text-slate-200",
              err && "text-red-500",
              err && "dark:text-red-500",
            )}
          >
            Password:
            <DarkModeSwitch className={cn("float-end")} />
          </div>
          <input
            type="password"
            className={cn(
              "rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900",
              "focus:ring-2 focus:ring-blue-500 focus:outline-none",
              "dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100",
              err && "border-red-900",
              err && "dark:border-red-900",
            )}
            onChange={(e) => {
              setError("");
              setPass(e.currentTarget.value);
            }}
            value={pass}
            autoFocus
          />
        </label>
        {err && (
          <div
            className={cn("mt-1 text-right text-sm font-semibold text-red-500")}
          >
            {err}
          </div>
        )}
        <button
          type="submit"
          className={cn(
            "mt-3 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white",
            "hover:bg-blue-700",
            "focus:ring-2 focus:ring-blue-500 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={login.isPending}
        >
          {login.isPending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
