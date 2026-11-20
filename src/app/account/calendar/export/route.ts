import { createClient } from "@/lib/supabase/server";

type Appointment = { id: string; patient_id: string; event_type: string; title: string; starts_at: string; ends_at: string | null; location: string | null; notes: string | null; status: string };

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let current = "";
  let bytes = 0;
  for (const character of line) {
    const characterBytes = new TextEncoder().encode(character).length;
    if (bytes + characterBytes > 73) { chunks.push(current); current = ` ${character}`; bytes = 1 + characterBytes; }
    else { current += character; bytes += characterBytes; }
  }
  chunks.push(current);
  return chunks.join("\r\n");
}

function toIcsDate(value: string) { return new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z"); }

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sign in to export calendar events." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const { data, error } = await supabase.from("appointments").select("id,patient_id,event_type,title,starts_at,ends_at,location,notes,status").order("starts_at", { ascending: true }).limit(1000);
  if (error) return Response.json({ error: "Calendar events could not be exported." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  const events = (data ?? []) as Appointment[];
  const patientIds = [...new Set(events.map((event) => event.patient_id))];
  const { data: profiles } = patientIds.length ? await supabase.from("patient_profiles").select("id,display_name").in("id", patientIds) : { data: [] };
  const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MedVita//Health Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const event of events) {
    lines.push("BEGIN:VEVENT", `UID:${event.id}@medvita.health`, `DTSTAMP:${toIcsDate(new Date().toISOString())}`, `DTSTART:${toIcsDate(event.starts_at)}`);
    if (event.ends_at) lines.push(`DTEND:${toIcsDate(event.ends_at)}`);
    lines.push(`SUMMARY:${escapeIcs(event.title)}`, `CATEGORIES:${escapeIcs(event.event_type)}`, `DESCRIPTION:${escapeIcs(`${profileNames.get(event.patient_id) ?? "Patient profile"} · ${event.status}${event.notes ? `\n${event.notes}` : ""}`)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
    lines.push(`STATUS:${event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const body = lines.map(foldIcsLine).join("\r\n") + "\r\n";
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="medvita-calendar.ics"', "Cache-Control": "private, no-store" } });
}
