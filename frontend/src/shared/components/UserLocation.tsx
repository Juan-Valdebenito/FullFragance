"use client";
import Link from "next/link";
import { useSession } from "@/shared/auth/SessionContext";
import { Icon } from "./Icon";
export function UserLocation() { const { user } = useSession(); return <Link href="/perfil"><Icon name="pin"/> {user.city?.name ?? "Elegir ciudad"}</Link>; }
