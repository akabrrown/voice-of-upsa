import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPollForAdmin } from "@/app/actions/polls";
import { EditPollClient } from "./EditPollClient";

export const metadata = {
  title: "Edit Poll | Admin",
};

export const dynamic = "force-dynamic";

export default async function EditPollPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard/admin/polls");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isStaff =
    profile?.role === "admin" ||
    profile?.role === "editor" ||
    profile?.role === "developer" ||
    profile?.is_admin === true;

  if (!isStaff) redirect("/dashboard");

  const result = await getPollForAdmin(params.id);
  if (!result.success || !result.data) {
    notFound();
  }

  return <EditPollClient poll={result.data} />;
}
