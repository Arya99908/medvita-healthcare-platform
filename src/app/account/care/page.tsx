import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, CalendarDays, ClipboardList, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import CareTaskList from "./care-task-list";

const taskStatuses = ["open", "complete", "missed"] as const;
type TaskStatus = (typeof taskStatuses)[number] | "all";

export default async function CareDashboardPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requestedStatus } = await searchParams;
  const selectedStatus: TaskStatus = requestedStatus === "complete" || requestedStatus === "missed" || requestedStatus === "open" ? requestedStatus : "all";
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: relationships, error: relationshipsError }, { data: taskRows, error: tasksError }] = await Promise.all([
    supabase.from("patient_relationships").select("patient_id").eq("user_id", user.id).eq("status", "active").eq("can_read", true),
    supabase.from("caregiver_tasks").select("id,patient_id,title,due_at,status,notes,assigned_to,created_by").eq("assigned_to", user.id).in("status", ["open", "complete", "missed"]).order("due_at", { ascending: true, nullsFirst: false }).limit(200),
  ]);
  const profileIds = [...new Set((taskRows ?? []).map((task) => task.patient_id))];
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase.from("patient_profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const tasks = (taskRows ?? []).map((task) => ({ ...task, patient_name: profileById.get(task.patient_id) ?? "Health profile" }));
  const hasLoadError = Boolean(relationshipsError || tasksError || profilesError);
  const countFor = (status: TaskStatus) => status === "all" ? tasks.length : tasks.filter((task) => task.status === status).length;
  const now = new Date().getTime();

  return <main className="account-page care-dashboard-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Profiles</Link><Link href="/account/notifications" className="account-back-link"><Bell size={15} /> Notifications</Link><Link href="/account/calendar" className="account-back-link"><CalendarDays size={15} /> Calendar</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="care-dashboard-content">
      <div className="account-welcome"><span className="micro-label">CARE TEAM WORKSPACE</span><h1>Care tasks</h1><p>Review tasks assigned to you across profiles you can read.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>This list includes only tasks assigned to your signed-in account and visible through active profile access. Task notes remain unverified care coordination records.</span></div>
      <section className="account-card care-dashboard-card" aria-labelledby="assigned-tasks-title">
        <div className="account-card-heading"><div><span className="micro-label">MY ASSIGNED TASKS</span><h2 id="assigned-tasks-title">Across readable profiles</h2><p>{relationships?.length ?? 0} active profile connections</p></div><span className="account-card-icon"><ClipboardList size={18} /></span></div>
        {hasLoadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Tasks could not be loaded</strong><span>Refresh the page or sign in again. No task details were shown.</span></div> : <>
          <nav className="care-dashboard-filters" aria-label="Filter tasks by status">{(["all", ...taskStatuses] as TaskStatus[]).map((status) => <Link key={status} href={status === "all" ? "/account/care" : `/account/care?status=${status}`} aria-current={selectedStatus === status ? "page" : undefined} className={selectedStatus === status ? "active" : ""}>{status === "all" ? "All" : status === "complete" ? "Completed" : status === "missed" ? "Missed" : "Open"}<span>{countFor(status)}</span></Link>)}</nav>
          <CareTaskList tasks={tasks} currentUserId={user.id} selectedStatus={selectedStatus} now={now} />
        </>}
      </section>
    </div>
  </main>;
}
