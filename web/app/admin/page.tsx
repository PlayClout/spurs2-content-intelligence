import { redirect } from "next/navigation";

/** The operator page moved into Settings. Old links keep working. */
export default async function AdminRedirect({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  redirect(`/settings?${new URLSearchParams({ ...(sp.org ? { org: sp.org } : {}), tab: "integrations" }).toString()}`);
}
