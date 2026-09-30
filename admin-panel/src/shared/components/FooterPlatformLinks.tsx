"use client";

import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { FOOTER_PLATFORM_ITEMS, filterNavItems } from "@/shared/navigation/navConfig";

export function FooterPlatformLinks() {
  const session = useOptionalSession();
  const links = filterNavItems(FOOTER_PLATFORM_ITEMS, session?.user ?? null);

  return (
    <>
      {links.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </>
  );
}
