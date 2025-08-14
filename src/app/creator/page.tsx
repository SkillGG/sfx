"use client";

import { useEffect, useState } from "react";
import CreatorPage from "./main";
import { api } from "@/trpc/react";
import { cn } from "@/utils";
import LoginPage from "./login";

const CheckCreatorLoginPage = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    if (userLoggedIn?.err) {
      setErr(userLoggedIn?.err);
      if (userLoggedIn.errcode === "INVALID_TOKEN") {
        sessionStorage.removeItem("stk");
      }
      if (userLoggedIn.errcode === "SESSSION_EXPIRED") {
        sessionStorage.removeItem("stk");
      }
    }

    const closeTimeout = setTimeout(() => {
      setErr("");
    }, 3000);

    return () => {
      clearTimeout(closeTimeout);
    };
  }, [userLoggedIn]);

  console.log(deviceName, userToken, userLoggedIn);

  if (isFetching) return <>Loading...</>;
  if (userLoggedIn?.ok) return <CreatorPage />;
  else
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
};

export default CheckCreatorLoginPage;
