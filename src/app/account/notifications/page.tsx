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
    supabase.from("notifications").select("id,patient_id,category,title,message,read_at,created_at,sent_at,delivery_status").eq("delivery_status", "sent").order("sent_at", { ascending: false }).limit(100),
    supabase.from("notification_preferences").select("category,channel,enabled").eq("user_id", user.id).eq("channel", "in_app"),
  ]);
  const taskPreference = preferences?.find((preference) => preference.category === "caregiver_task")?.enabled ?? true;
  const appointmentPreference = preferences?.find((preference) => preference.category === "appointment_reminder")?.enabled ?? true;
  const medicationPreference = preferences?.find((preference) => preference.category === "medication_reminder")?.enabled ?? true;
  const vaccinationPreference = preferences?.find((preference) => preference.category === "vaccination_reminder")?.enabled ?? true;
  const followUpPreference = preferences?.find((preference) => preference.category === "developmental_follow_up_reminder")?.enabled ?? true;
  const hasLoadError = Boolean(notificationsError || preferencesError);

  return <main className="account-page care-dashboard-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Profiles</Link><Link href="/account/care" className="account-back-link"><ClipboardList size={15} /> Care tasks</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="care-dashboard-content">
      <div className="account-welcome"><span className="micro-label">YOUR ACCOUNT</span><h1>Notifications</h1><p>Review in-app updates sent to your account.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>In-app reminders appear here when due. They use generic text and link only to records your account can access. Email, SMS, and push are not connected.</span></div>
      <section className="account-card care-dashboard-card" aria-labelledby="notification-preferences-title">
        <div className="account-card-heading"><div><span className="micro-label">PREFERENCES</span><h2 id="notification-preferences-title">In-app alerts</h2><p>Choose which available updates appear here.</p></div><span className="account-card-icon"><Bell size={18} /></span></div>
        <div className="notification-preference-row"><div><strong>Care task assignments</strong><span>Notify this account when a care task is assigned.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="caregiver_task" /><input type="hidden" name="enabled" value={taskPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {taskPreference ? "off" : "on"}</button></form><span className={`account-status ${taskPreference ? "active" : "inactive"}`}>{taskPreference ? "On" : "Off"}</span></div>
        <div className="notification-preference-row"><div><strong>Appointment reminders</strong><span>Show a private in-app alert about 24 hours before an event you add.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="appointment_reminder" /><input type="hidden" name="enabled" value={appointmentPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {appointmentPreference ? "off" : "on"}</button></form><span className={`account-status ${appointmentPreference ? "active" : "inactive"}`}>{appointmentPreference ? "On" : "Off"}</span></div>
        <div className="notification-preference-row"><div><strong>Medication schedule reminders</strong><span>Show private reminders at times and days explicitly selected for a schedule.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="medication_reminder" /><input type="hidden" name="enabled" value={medicationPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {medicationPreference ? "off" : "on"}</button></form><span className={`account-status ${medicationPreference ? "active" : "inactive"}`}>{medicationPreference ? "On" : "Off"}</span></div>
        <div className="notification-preference-row"><div><strong>Vaccination date reminders</strong><span>Show a private alert at 9:00 AM on dates you entered and opted to be reminded about.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="vaccination_reminder" /><input type="hidden" name="enabled" value={vaccinationPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {vaccinationPreference ? "off" : "on"}</button></form><span className={`account-status ${vaccinationPreference ? "active" : "inactive"}`}>{vaccinationPreference ? "On" : "Off"}</span></div>
        <div className="notification-preference-row"><div><strong>Care follow-up reminders</strong><span>Show a private alert for child follow-up dates you entered and opted to be reminded about.</span></div><form action={updateNotificationPreference}><input type="hidden" name="category" value="developmental_follow_up_reminder" /><input type="hidden" name="enabled" value={followUpPreference ? "false" : "true"} /><button className="secondary-button" type="submit">Turn {followUpPreference ? "off" : "on"}</button></form><span className={`account-status ${followUpPreference ? "active" : "inactive"}`}>{followUpPreference ? "On" : "Off"}</span></div>
        <p className="notification-channel-note">Scheduled in-app reminders are checked every minute. Email, SMS, and push delivery are not configured.</p>
      </section>
      <section className="account-card care-dashboard-card" aria-labelledby="notification-list-title">
        <div className="account-card-heading"><div><span className="micro-label">RECENT</span><h2 id="notification-list-title">Your updates</h2><p>{notifications?.filter((item) => !item.read_at).length ?? 0} unread</p></div><span className="account-card-icon"><Bell size={18} /></span></div>
        {hasLoadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Notifications could not be loaded</strong><span>Refresh the page or sign in again.</span></div>
          : notifications?.length ? <div className="notification-list">{notifications.map((notification) => <article className={`notification-item ${notification.read_at ? "read" : "unread"}`} key={notification.id}>
            <div><span className="notification-category">{notification.category.replaceAll("_", " ")}</span><LocalDateTime value={notification.sent_at ?? notification.created_at} /></div><h3>{notification.title}</h3><p>{notification.message}</p>
            <div className="notification-item-footer">{notification.patient_id && <Link className="account-record-link" href={`/account/patients/${notification.patient_id}`}>Open profile</Link>}{!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><button className="secondary-button" type="submit"><Check size={14} /> Mark read</button></form>}{notification.read_at && <span className="timeline-verification">Read</span>}</div>
          </article>)}</div>
            : <div className="account-empty-state"><Bell size={22} /><strong>You&apos;re all caught up</strong><span>Care task updates and reminders for dates you entered appear here when available.</span></div>}
      </section>
    </div>
  </main>;
}
