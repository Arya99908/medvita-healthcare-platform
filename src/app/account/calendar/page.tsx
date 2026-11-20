import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Download, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import AppointmentStatusForm from "../patients/appointment-status-form";
import { AppointmentDeleteForm, AppointmentEditForm } from "./appointment-actions";
import CalendarAppointmentForm from "./calendar-appointment-form";
import LocalDateTime from "@/components/local-date-time";

type CalendarView = "month" | "week" | "day" | "agenda";
type CalendarSearch = { view?: string; date?: string };
type CalendarEvent = { id: string; patient_id: string; event_type: string; title: string; starts_at: string; ends_at: string | null; location: string | null; notes: string | null; status: string };

const dayMs = 24 * 60 * 60 * 1000;
const stageLabels: Record<string, string> = { infant: "Infant", child: "Child", adolescent: "Adolescent", adult: "Adult", senior: "Senior" };

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`) : parsed;
}

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(date: Date, amount: number) { return new Date(date.valueOf() + amount * dayMs); }
function mondayStart(date: Date) { const start = new Date(date); start.setUTCHours(0, 0, 0, 0); return addDays(start, -((start.getUTCDay() + 6) % 7)); }
function datesBetween(start: Date, end: Date) { const days: Date[] = []; for (let day = start; day < end; day = addDays(day, 1)) days.push(day); return days; }
function formatDay(date: Date, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) { return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(date); }
function viewRange(view: CalendarView, selected: Date) {
  if (view === "month") { const first = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1)); const start = mondayStart(first); return { start, end: addDays(start, 42) }; }
  if (view === "week") { const start = mondayStart(selected); return { start, end: addDays(start, 7) }; }
  if (view === "day") { const start = new Date(selected); start.setUTCHours(0, 0, 0, 0); return { start, end: addDays(start, 1) }; }
  const start = new Date(selected); start.setUTCHours(0, 0, 0, 0); return { start, end: addDays(start, 30) };
}

function shiftedDate(date: Date, view: CalendarView, direction: -1 | 1) {
  const shifted = new Date(date);
  if (view === "month") shifted.setUTCMonth(shifted.getUTCMonth() + direction, 1);
  else shifted.setUTCDate(shifted.getUTCDate() + direction * (view === "week" ? 7 : view === "agenda" ? 30 : 1));
  return dateKey(shifted);
}

function EventCard({ event, patientName, canWrite }: { event: CalendarEvent; patientName: string; canWrite: boolean }) {
  return <article className="calendar-event-card">
    <div className="calendar-event-time"><LocalDateTime value={event.starts_at} />{event.ends_at && <><span>to</span><LocalDateTime value={event.ends_at} /></>}</div>
    <div className="calendar-event-copy"><span className="micro-label">{event.event_type.replaceAll("_", " ")} · {event.status}</span><h3>{event.title}</h3><p>{patientName}{event.location ? ` · ${event.location}` : ""}</p>{event.notes && <p className="calendar-event-notes">{event.notes}</p>}<Link className="account-record-link" href={`/account/patients/${event.patient_id}`}>Open profile timeline</Link>{canWrite && <><AppointmentStatusForm patientId={event.patient_id} appointmentId={event.id} status={event.status} /><div className="calendar-event-actions"><AppointmentEditForm patientId={event.patient_id} appointment={event} /><AppointmentDeleteForm patientId={event.patient_id} appointmentId={event.id} /></div></>}</div>
  </article>;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<CalendarSearch> }) {
  const params = await searchParams;
  const view = (["month", "week", "day", "agenda"].includes(params.view ?? "") ? params.view : "agenda") as CalendarView;
  const selectedDate = parseDate(params.date);
  const range = viewRange(view, selectedDate);
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [{ data: relationships, error: relationshipError }, { data: profiles, error: profilesError }, { data: appointments, error: appointmentsError }] = await Promise.all([
    supabase.from("patient_relationships").select("patient_id,status,can_read,can_write").eq("user_id", user.id),
    supabase.from("patient_profiles").select("id,display_name,life_stage"),
    supabase.from("appointments").select("id,patient_id,event_type,title,starts_at,ends_at,location,notes,status").gte("starts_at", range.start.toISOString()).lt("starts_at", range.end.toISOString()).order("starts_at", { ascending: true }).limit(500),
  ]);
  const relationshipByPatient = new Map((relationships ?? []).map((relationship) => [relationship.patient_id, relationship]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const writableProfiles = (profiles ?? []).filter((profile) => { const relationship = relationshipByPatient.get(profile.id); return relationship?.status === "active" && relationship.can_read && relationship.can_write; });
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of (appointments ?? []) as CalendarEvent[]) {
    const key = event.starts_at.slice(0, 10);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
  }
  const days = datesBetween(range.start, range.end);
  const title = view === "month" ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(selectedDate)
    : view === "week" ? `${formatDay(range.start, { day: "numeric", month: "short" })} – ${formatDay(addDays(range.end, -1), { day: "numeric", month: "short", year: "numeric" })}`
      : view === "day" ? formatDay(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : `${formatDay(range.start, { day: "numeric", month: "short" })} – ${formatDay(addDays(range.end, -1), { day: "numeric", month: "short", year: "numeric" })}`;
  const calendarHref = (nextView: CalendarView, date: string) => `/account/calendar?view=${nextView}&date=${date}`;

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Your profiles</Link><Link href="/account/care" className="account-back-link"><ClipboardList size={15} /> Care tasks</Link><Link href="/" className="account-back-link">Presentation demo</Link><form action={signOut}><button type="submit" className="account-signout">Sign out</button></form></div></header>
    <div className="patient-timeline-layout calendar-page-layout">
      <div className="account-welcome"><span className="micro-label">MEDICAL CALENDAR</span><h1>Care calendar</h1><p>Appointments and health events across profiles you can read.</p></div>
      <div className="account-safety-note"><ShieldCheck size={17} /><span>Calendar events are private profile records. No reminders, external bookings, or calendar sync are configured.</span></div>
      <CalendarAppointmentForm patients={writableProfiles.map(({ id, display_name, life_stage }) => ({ id, display_name, life_stage: stageLabels[life_stage] ?? life_stage }))} />
      <section className="account-card calendar-card" aria-labelledby="calendar-view-title">
        <div className="calendar-toolbar"><div><span className="micro-label">{view.toUpperCase()} VIEW</span><h2 id="calendar-view-title">{title}</h2></div><div className="calendar-view-links" aria-label="Calendar display"><Link aria-current={view === "month" ? "page" : undefined} href={calendarHref("month", dateKey(selectedDate))}>Month</Link><Link aria-current={view === "week" ? "page" : undefined} href={calendarHref("week", dateKey(selectedDate))}>Week</Link><Link aria-current={view === "day" ? "page" : undefined} href={calendarHref("day", dateKey(selectedDate))}>Day</Link><Link aria-current={view === "agenda" ? "page" : undefined} href={calendarHref("agenda", dateKey(selectedDate))}>Agenda</Link></div></div>
        <form action="/account/calendar" method="get" className="calendar-filter-form"><input type="hidden" name="view" value={view} /><label htmlFor="calendar-date">Go to date</label><input id="calendar-date" name="date" type="date" defaultValue={dateKey(selectedDate)} /><button className="account-record-link" type="submit">Show date</button><Link className="account-record-link" href={calendarHref(view, dateKey(new Date()))}>Today</Link><Link className="account-record-link" href="/account/calendar/export"><Download size={14} /> Export ICS</Link></form>
        <div className="calendar-range-links"><Link href={calendarHref(view, shiftedDate(selectedDate, view, -1))}><ChevronLeft size={15} /> Previous</Link><Link href={calendarHref(view, shiftedDate(selectedDate, view, 1))}>Next <ChevronRight size={15} /></Link></div>
        {relationshipError || profilesError || appointmentsError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Calendar could not be loaded</strong><span>Refresh the page or sign in again.</span></div>
          : view === "month" ? <div className="calendar-month-grid"><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>{days.map((day) => { const key = dateKey(day); const dayEvents = eventsByDay.get(key) ?? []; const inMonth = day.getUTCMonth() === selectedDate.getUTCMonth(); return <div key={key} className={`calendar-day-cell${inMonth ? "" : " outside-month"}`}><Link className="calendar-day-number" href={calendarHref("day", key)}>{day.getUTCDate()}</Link>{dayEvents.slice(0, 3).map((event) => <Link key={event.id} href={calendarHref("day", key)} className="calendar-day-event">{event.title}</Link>)}{dayEvents.length > 3 && <span className="calendar-more">+{dayEvents.length - 3} more</span>}</div>; })}</div>
            : <div className="calendar-agenda">{days.map((day) => { const key = dateKey(day); const dayEvents = eventsByDay.get(key) ?? []; return <section className="calendar-agenda-day" key={key}><h3>{formatDay(day, { weekday: "long", day: "numeric", month: "long" })}</h3>{dayEvents.length ? dayEvents.map((event) => { const profile = profileById.get(event.patient_id); const relationship = relationshipByPatient.get(event.patient_id); return <EventCard key={event.id} event={event} patientName={profile?.display_name ?? "Patient profile"} canWrite={relationship?.status === "active" && Boolean(relationship.can_write)} />; }) : <p className="calendar-day-empty">No events scheduled.</p>}</section>; })}</div>}
      </section>
      <div className="account-safety-note"><CalendarDays size={17} /><span>Time values are stored as UTC instants and displayed in your browser’s local time. Export contains only events visible to your signed-in account.</span></div>
    </div>
  </main>;
}
