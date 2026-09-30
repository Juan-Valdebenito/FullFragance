"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/shared/api/client";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || navigator.doNotTrack === "1") return;
    void api.trackPageView(pathname).catch(() => undefined);
  }, [pathname]);

  return null;
}
