type IconName = "pin" | "chart" | "compass" | "user" | "logout" | "search" | "filter" | "heart" | "arrow" | "leaf" | "tree" | "flower" | "menu";
const paths: Record<IconName, React.ReactNode> = {
  pin: <><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/></>,
  user: <><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4"/>,
  heart: <path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10a4 4 0 0 1 7-2.7l1 1 1-1A4 4 0 0 1 20 8.5Z"/>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  leaf: <><path d="M20 4C10 4 5 9 5 16c7 1 12-3 15-12Z"/><path d="M4 20c3-5 7-8 12-11"/></>,
  tree: <><path d="m12 3-5 7h3l-4 6h5v5h2v-5h5l-4-6h3l-5-7Z"/></>,
  flower: <><circle cx="12" cy="12" r="2"/><circle cx="12" cy="7" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="17" r="3"/><circle cx="7" cy="12" r="3"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
