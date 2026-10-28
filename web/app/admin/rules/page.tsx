import { redirect } from "next/navigation";

/** Rights rules moved into Settings. Old links keep working. */
export default async function RulesRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  redirect(`/settings?${new URLSearchParams({ ...(sp.org ? { org: sp.org } : {}), tab: "rules" }).toString()}`);
}
