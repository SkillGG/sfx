"use client";

import { api } from "@/trpc/react";
import { cn } from "@/utils/utils";
import { useState } from "react";
import DarkModeSwitch, { AccentSwitch } from "../_components/darkModeSwitch";
import { useTheme } from "../hooks/theme";

const LoginPage = () => {
  const [pass, setPass] = useState<string>("");
  const login = api.user.logIn.useMutation();

  const { mode } = useTheme();

  const [err, setError] = useState("");

  const [capslock, setCapslock] = useState(false);

  const [show, setShow] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-(--deeper-bg)",
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
        <label className={cn("flex flex-col gap-2")} htmlFor="pass">
          <div
            className={cn(
              "mb-0 flex items-center gap-2",
              "text-base font-medium text-slate-700 dark:text-slate-200",
              err && "text-red-500",
              err && "dark:text-red-500",
            )}
          >
            Password:
            <AccentSwitch className={cn("ml-auto h-4 w-4")} />
            <DarkModeSwitch />
          </div>
          <div
            className={cn(
              "rounded-md ring-(color:--input-focus-border) focus-within:ring-2",
              capslock && "ring-(color:--input-warn-border)",
            )}
          >
            <input
              type={show ? "text" : "password"}
              className={cn(
                "rounded-md rounded-r-none border border-r-0",
                "border-(--input-border) bg-(--input-bg) px-3 py-2",
                "text-(--label-text) focus:ring-0 focus:outline-none",
                err && "border-(--input-error-border)",
                !show && "text-(--input-text)",
              )}
              onChange={(e) => {
                setError("");
                setPass(e.currentTarget.value);
              }}
              onKeyDown={(k) => {
                setCapslock(k.getModifierState("CapsLock"));
              }}
              id="pass"
              value={pass}
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => {
                (
                  e.currentTarget.previousElementSibling as HTMLElement | null
                )?.focus({ preventScroll: true });
                setShow((p) => !p);
              }}
              className={cn(
                "border border-l-0 border-(--input-border) bg-(--input-bg)",
                "rounded-md rounded-l-none px-4 py-2 font-semibold hover:bg-(--button-submit-bg)",
                "cursor-pointer text-(--label-text) hover:text-(--button-submit-text)",
                "focus:bg-(--button-submit-bg) focus:outline-0",
                "disabled:cursor-not-allowed disabled:opacity-50",
                capslock && "text-(--notice-700)",
              )}
            >
              {capslock ? "CAPS!" : show ? "Hide" : "Show"}
            </button>
          </div>
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
            "mt-3 rounded-md bg-(--button-submit-bg) px-4 py-2 font-semibold",
            "cursor-pointer text-(--button-submit-text)",
            "hover:bg-(--button-submit-hover-bg)",
            "focus:ring-2 focus:ring-(color:--input-focus-border) focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={login.isPending}
        >
          {login.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
