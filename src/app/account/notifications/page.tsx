import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Check, ClipboardList, LogOut, ShieldCheck } from "lucide-react";
import LocalDateTime from "@/components/local-date-time";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { markNotificationRead, updateNotificationPreference } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: notifications, error: notificationsError }, { data: preferences, error: preferencesError }] = await Promise.all([
    supabase.from("notifications").select("id,patient_id,category,title,message,read_at,created_at,delivery_status").order("created_at", { ascending: false }).limit(100),
    supabase.from("notification_preferences").select("category,channel,enabled").eq("user_id", user.id).eq("channel", "in_app"),
  ]);
  const taskPreference = preferences?.find((preference) => preference.category === "caregiver_task")?.enabled ?? true;
  const hasLoadError = Boolean(notificationsError || preferencesError);

  return <main className="account-page care-dashboard-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Profiles</Link><Link href="/account/care" className="account-back-link"><ClipboardList size={15} /> Care tasks</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="care-dashboard-content">
      <div className="account-welcome"><span className="micro-label">YOUR ACCOUNT</span><h1>Notifications</h1><p>Review in-app updates sent to your account.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Notifications use generic text and link only to records your account can access. Email, SMS, push, and timed reminders are not connected.</span></div>
      <section className="account-card care-dashboard-card" aria-labelledby="notification-preferences-title">
        <div className="account-card-heading"><div><span className="micro-label">PREFERENCES</span><h2 id="notification-preferences-title">In-app alerts</h2><p>Choose which available updates appear here.</p></div><span className="account-card-icon"><Bell size={18} /></span></div>
        <div className="notification-preference-row"><div><strong>Care task assignments</strong><span>Notify this account when a care task is assigned.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="caregiver_task" /><input type="hidden" name="enabled" value={taskPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {taskPreference ? "off" : "on"}</button></form><span className={`account-status ${taskPreference ? "active" : "inactive"}`}>{taskPreference ? "On" : "Off"}</span></div>
        <p className="notification-channel-note">Other notification categories and delivery channels can be enabled after their reminder and delivery services are configured.</p>
      </section>
      <section className="account-card care-dashboard-card" aria-labelledby="notification-list-title">
        <div className="account-card-heading"><div><span className="micro-label">RECENT</span><h2 id="notification-list-title">Your updates</h2><p>{notifications?.filter((item) => !item.read_at).length ?? 0} unread</p></div><span className="account-card-icon"><Bell size={18} /></span></div>
        {hasLoadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Notifications could not be loaded</strong><span>Refresh the page or sign in again.</span></div>
          : notifications?.length ? <div className="notification-list">{notifications.map((notification) => <article className={`notification-item ${notification.read_at ? "read" : "unread"}`} key={notification.id}>
            <div><span className="notification-category">{notification.category.replaceAll("_", " ")}</span><LocalDateTime value={notification.created_at} /></div><h3>{notification.title}</h3><p>{notification.message}</p>
            <div className="notification-item-footer">{notification.patient_id && <Link className="account-record-link" href={`/account/patients/${notification.patient_id}`}>Open profile</Link>}{!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><button className="secondary-button" type="submit"><Check size={14} /> Mark read</button></form>}{notification.read_at && <span className="timeline-verification">Read</span>}</div>
          </article>)}</div>
            : <div className="account-empty-state"><Bell size={22} /><strong>You&apos;re all caught up</strong><span>New care task assignments will appear here if in-app alerts are on.</span></div>}
      </section>
    </div>
  </main>;
}
