"use client";
import { useRouter } from "next/navigation";
import { session } from "@/shared/api/client";
import { Icon } from "./Icon";
export function LogoutButton() { const router = useRouter(); return <button aria-label="Cerrar sesión" style={{border:0,background:"transparent",display:"grid"}} onClick={() => { session.clear(); router.push("/login"); }}><Icon name="logout" /></button>; }
