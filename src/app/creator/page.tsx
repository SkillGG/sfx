"use client";

import { useEffect, useState } from "react";
import CreatorPage from "./main";
import { api } from "@/trpc/react";
import { cn } from "@/utils";
import LoginPage from "./login";
import { UserSessionProvider } from "../hooks/userlogin";
import { useDarkMode } from "../hooks/darkmode";

const LoadPageSpinner = () => {
  const { mode } = useDarkMode();
  return (
    <div
      className={cn(
        "flex h-screen w-full items-center justify-center bg-blue-50",
        "dark:bg-slate-900",
        mode,
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-8 shadow-lg",
          "dark:bg-slate-800",
        )}
      >
        <div
          className={cn(
            "h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent",
            "dark:border-blue-300 dark:border-t-transparent",
          )}
          aria-label="Loading spinner"
        />
      </div>
    </div>
  );
};

const CheckCreatorLoginPage = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const [firstLoad, setFirstLoad] = useState(false);

  const { isFetching, data: userLoggedIn } = api.user.checkLogin.useQuery(
    {
      token: userToken ?? "",
      deviceName: deviceName ?? "",
    },
    { enabled: !!userToken && !!deviceName },
  );

  const [err, setErr] = useState("");

  useEffect(() => {
    const usertok = sessionStorage.getItem("stk");
    const dName = sessionStorage.getItem("dnam");
    setUserToken(usertok);
    setDeviceName(dName);
    setFirstLoad(true);
  }, []);

  useEffect(() => {
    if (!userLoggedIn) return;

    if (!userLoggedIn.ok) {
      setErr(userLoggedIn.err);
      if (userLoggedIn.errcode === "INVALID_TOKEN") {
        sessionStorage.removeItem("stk");
      }
      if (userLoggedIn.errcode === "SESSSION_EXPIRED") {
        sessionStorage.removeItem("stk");
      }
    }
  }, [userLoggedIn]);

  if (isFetching) return <LoadPageSpinner key={"lps"} />;

  if (userLoggedIn?.ok)
    return (
      <UserSessionProvider>
        <CreatorPage />
      </UserSessionProvider>
    );
  else if (firstLoad)
    return (
      <>
        {err && (
          <div
            className={cn(
              "absolute top-4 right-4 z-50 max-w-xs min-w-[220px] rounded-lg px-4 py-3",
              "bg-red-600 text-white shadow-lg",
              "flex items-center justify-between gap-4",
            )}
            role="alert"
            onClick={() => setErr("")}
            style={{ cursor: "pointer" }}
          >
            <span className={cn("flex-1 text-sm font-medium")}>{err}</span>
          </div>
        )}
        <LoginPage />
      </>
    );

  return <LoadPageSpinner key={"lps"} />;
};

export default CheckCreatorLoginPage;
