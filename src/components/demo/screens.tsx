"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Leaf,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  type DemoData,
  type Entry,
  type Patient,
  TODAY,
  dateLabel,
  uid,
  download,
  calendarExport,
  eventTypes,
  services,
} from "@/lib/demo/data";
import {
  occursOn,
  monthOccurrences,
  ageLabel,
  medicationActive,
} from "@/lib/demo/selectors";
import { AddButton, Badge, EntryList, Panel, Empty } from "./ui";
type Setter = Dispatch<SetStateAction<DemoData | null>>;
export function CalendarScreen({
  entries,
  documents,
  add,
  edit,
  patch,
  remove,
}: {
  entries: Entry[];
  documents: Entry[];
  add: (e: Partial<Entry>) => void;
  edit: (e: Entry) => void;
  patch: (e: Entry, c: Record<string, string>) => void;
  remove: (e: Entry) => void;
}) {
  const [view, setView] = useState("Month"),
    [date, setDate] = useState(TODAY),
    [filter, setFilter] = useState("All events"),
    [selected, setSelected] = useState<Entry | null>(null);
  const d = new Date(date + "T12:00:00");
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - offset);
  const key = (v: Date) =>
    `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  const matches = occursOn;
  const filtered = entries.filter(
    (e) => filter === "All events" || e.type === filter,
  );
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const days = Array.from(
    { length: view === "Month" ? 42 : view === "Week" ? 7 : 1 },
    (_, i) => {
      const dt = new Date(
        view === "Month" ? start : view === "Week" ? weekStart : d,
      );
      dt.setDate(dt.getDate() + i);
      return dt;
    },
  );
  const move = (n: number) => {
    const next = new Date(d);
    if (view === "Month" || view === "Agenda") {
      next.setDate(1);
      next.setMonth(next.getMonth() + n);
    } else next.setDate(next.getDate() + n * (view === "Week" ? 7 : 1));
    setDate(key(next));
  };
  return (
    <>
      <div className="calendar-toolbar">
        <div className="tabs">
          {["Month", "Week", "Day", "Agenda"].map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="chip-wrap">
          <select
            aria-label="Calendar category"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All events", ...eventTypes].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() =>
              download(
                "medvita-calendar.ics",
                calendarExport(filtered),
                "text/calendar",
              )
            }
          >
            <Download size={15} />
            Export ICS
          </button>
          <AddButton label="Add event" onClick={() => add({ date })} />
        </div>
      </div>
      <Panel
        title={d.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}
        action={
          <div className="chip-wrap">
            <button aria-label="Previous period" onClick={() => move(-1)}>
              <ArrowLeft size={16} />
            </button>
            <button onClick={() => setDate(TODAY)}>Today</button>
            <button aria-label="Next period" onClick={() => move(1)}>
              <ArrowRight size={16} />
            </button>
          </div>
        }
      >
        {view === "Agenda" ? (
          <EntryList
            entries={monthOccurrences(filtered, date.slice(0, 7))}
            edit={(occurrence) =>
              setSelected({
                ...entries.find((e) => e.id === occurrence.seriesId)!,
                occurrence: occurrence.date,
              })
            }
          />
        ) : (
          <div className={`calendar-grid ${view.toLowerCase()}`}>
            {view !== "Day" &&
              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div className="weekday" key={day}>
                  {day}
                </div>
              ))}
            {days.map((dt) => {
              const day = key(dt);
              return (
                <div
                  className={`calendar-cell ${day === TODAY ? "today" : ""} ${dt.getMonth() !== d.getMonth() ? "outside" : ""}`}
                  key={day}
                >
                  <button
                    className="day-number"
                    aria-label={`Add event on ${day}`}
                    onClick={() => add({ date: day })}
                  >
                    {dt.getDate()}
                  </button>
                  {filtered
                    .filter((e) => matches(e, day))
                    .map((e) => (
                      <button
                        className={`calendar-event ${e.type === "Caregiver visit" ? "purple" : e.type === "Exercise session" ? "green" : ""} ${e.status === "Cancelled" ? "cancelled" : ""}`}
                        key={e.id}
                        onClick={() => setSelected({ ...e, occurrence: day })}
                      >
                        <span>{e.time}</span>
                        {e.title}
                        {view !== "Month" && (
                          <small>
                            {e.location} · {e.status}
                          </small>
                        )}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        )}
        <div className="calendar-legend">
          <span>
            <i />
            Medical care
          </span>
          <span>
            <i className="purple" />
            Caregiver visits
          </span>
          <span>
            <i className="green" />
            Exercise
          </span>
          <small>
            Recurring series are expanded in every view. Status changes apply to
            the whole series.
          </small>
        </div>
      </Panel>
      {selected && (
        <Dialog
          open
          onOpenChange={() => setSelected(null)}
          title={selected.title}
        >
          <Badge>{selected.status}</Badge>
          <dl className="details-list">
            {[
              ["Date", selected.occurrence || selected.date],
              ["Time", `${selected.time}–${selected.end}`],
              ["Type", selected.type],
              ["Doctor", selected.doctor],
              ["Caregiver", selected.caregiver],
              ["Location", selected.location],
              ["Recurrence", selected.recurrence],
              [
                "Reminder",
                `${selected.reminder || 0} minutes before (simulated)`,
              ],
              [
                "Document",
                selected.attachment === "None"
                  ? "None"
                  : documents.find(
                      (d) =>
                        d.id === selected.attachment ||
                        d.title === selected.attachment,
                    )?.title ||
                    (selected.attachment
                      ? "Attached document is no longer available"
                      : "Not recorded"),
              ],
              ["Notes", selected.notes],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || "Not recorded"}</dd>
              </div>
            ))}
          </dl>
          {selected.attachment &&
            selected.attachment !== "None" &&
            documents.find(
              (d) =>
                d.id === selected.attachment || d.title === selected.attachment,
            ) && (
              <details>
                <summary>Preview attached document</summary>
                {(() => {
                  const doc = documents.find(
                    (d) =>
                      d.id === selected.attachment ||
                      d.title === selected.attachment,
                  )!;
                  return doc.file ? (
                    <iframe
                      className="document-preview"
                      title="Attached document preview"
                      sandbox={doc.mime === "application/pdf" ? undefined : ""}
                      src={doc.file}
                    />
                  ) : (
                    <pre className="report">{doc.notes}</pre>
                  );
                })()}
              </details>
            )}
          <p className="muted">
            Edits and statuses apply to the entire recurring series.
          </p>
          <div className="chip-wrap">
            <button
              onClick={() => {
                edit(entries.find((e) => e.id === selected.id)!);
                setSelected(null);
              }}
            >
              Edit / reschedule
            </button>
            {["Completed", "Missed", "Cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  patch(
                    entries.find((e) => e.id === selected.id)!,
                    { status: s },
                  );
                  setSelected(null);
                }}
              >
                {s}
              </button>
            ))}
            <button
              className="danger"
              onClick={() => {
                remove(selected);
                setSelected(null);
              }}
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
export function DocumentsScreen({
  patient,
  entries,
  save,
  edit,
  remove,
  toast,
}: {
  patient: Patient;
  entries: Entry[];
  save: (e: Entry) => void;
  edit: (e: Entry) => void;
  remove: (e: Entry) => void;
  toast: (s: string) => void;
}) {
  const [preview, setPreview] = useState<Entry | null>(null),
    [type, setType] = useState("All categories"),
    [ocr, setOcr] = useState<Entry | null>(null),
    [extracted, setExtracted] = useState(""),
    [uploading, setUploading] = useState(false);
  const types = [
    "Prescription",
    "Laboratory report",
    "Imaging report",
    "Discharge summary",
    "Vaccination certificate",
    "Consultation notes",
    "Medical history",
  ];
  async function upload(file: File) {
    if (file.size > 1500000) {
      toast("Choose a demo file smaller than 1.5 MB to fit browser storage.");
      return;
    }
    if (
      !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
        file.type,
      )
    ) {
      toast("Choose a PDF, PNG, JPEG or plain text file.");
      return;
    }
    setUploading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      save({
        id: uid(),
        patient: patient.id,
        category: "document",
        title: file.name,
        date: TODAY,
        status: "Uploaded locally",
        source: "Uploaded document",
        type: type === "All categories" ? "Medical history" : type,
        doctor: patient.doctor,
        notes: "Local fictional demonstration upload.",
        file: data,
        mime: file.type,
      });
      toast("Document uploaded. Preview and download are available.");
    } catch {
      toast("Could not read this file. Please try again.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      <div className="upload-zone">
        <span className="upload-icon">
          <Upload size={28} />
        </span>
        <h2>Your health story, all together.</h2>
        <p>Upload fictional reports, prescriptions and consultation notes.</p>
        <label className="button primary">
          {uploading ? "Reading file…" : "Choose a demo document"}
          <input
            aria-label="Upload demo document"
            type="file"
            accept="application/pdf,image/png,image/jpeg,text/plain"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.[0]) void upload(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        <small>
          PDF, PNG, JPG or TXT · Up to 1.5 MB · Stored in this browser only
        </small>
      </div>
      <Panel
        title="Document library"
        action={
          <select
            aria-label="Document category"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All categories", ...types].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        }
      >
        {!entries.some((e) => type === "All categories" || e.type === type) && (
          <Empty text="No documents match these filters. Clear search or choose another category, or upload a fictional document." />
        )}
        <div className="document-grid">
          {entries
            .filter((e) => type === "All categories" || e.type === type)
            .map((e) => (
              <article className="document-card" key={e.id}>
                <FileText size={28} />
                <Badge tone="grey">{e.type}</Badge>
                <h3>{e.title}</h3>
                <p>{e.doctor}</p>
                <small>
                  {dateLabel(e.date)} · {e.status}
                </small>
                <div className="chip-wrap">
                  <button onClick={() => setPreview(e)}>Preview</button>
                  <button onClick={() => edit(e)}>Edit</button>
                  <button
                    onClick={() => {
                      setOcr(e);
                      setExtracted(
                        e.extracted ||
                          `Patient: ${patient.name}\nDocument: ${e.type}\nClinician: ${e.doctor}\nDate: ${e.date}\nSample finding: Verify all fields against the original document.`,
                      );
                    }}
                  >
                    Mock extraction
                  </button>
                  <button onClick={() => remove(e)}>Delete</button>
                </div>
              </article>
            ))}
        </div>
      </Panel>
      {preview && (
        <Dialog
          open
          onOpenChange={() => setPreview(null)}
          title={preview.title}
        >
          {preview.file ? (
            <iframe
              className="document-preview"
              title="Local document preview"
              sandbox={preview.mime === "application/pdf" ? undefined : ""}
              src={preview.file}
            />
          ) : (
            <pre className="report">{preview.notes}</pre>
          )}
          {preview.extracted && (
            <>
              <h3>Manually reviewed demonstration fields</h3>
              <pre className="report">{preview.extracted}</pre>
            </>
          )}
          {preview.file ? (
            <a
              className="button primary"
              href={preview.file}
              download={preview.title}
            >
              Download original
            </a>
          ) : (
            <button
              onClick={() => download(`${preview.title}.txt`, preview.notes)}
            >
              Download sample
            </button>
          )}
        </Dialog>
      )}
      {ocr && (
        <Dialog
          open
          onOpenChange={() => setOcr(null)}
          title="Demonstration document extraction"
        >
          <div className="notice">
            Sample fields only. This simulation does not read or interpret your
            file. Manually compare every field against the original.
          </div>
          <label>
            Correct the sample fields
            <textarea
              className="extraction"
              value={extracted}
              onChange={(e) => setExtracted(e.target.value)}
            />
          </label>
          <button
            className="primary"
            disabled={!extracted.trim()}
            onClick={() => {
              save({ ...ocr, extracted, status: "Manually reviewed (demo)" });
              setOcr(null);
            }}
          >
            Verify & save corrected fields
          </button>
        </Dialog>
      )}
    </>
  );
}
const wellnessContent = {
  Exercise: [
    [
      "Gentle movement",
      "A comfortable movement break",
      "Build a consistent activity routine.",
      "Choose an activity appropriate to ability. Stop if uncomfortable; ask your clinician about restrictions.",
    ],
    [
      "Balance & mobility",
      "Move with confidence",
      "Support a daily mobility habit.",
      "For older adults, use stable support and a caregiver if needed. Seek professional guidance after falls.",
    ],
    [
      "Strength & flexibility",
      "Make room for movement",
      "Keep a weekly education and activity plan.",
      "Seek qualified guidance on suitable movements; avoid painful exercises.",
    ],
  ],
  "Food & nutrition": [
    [
      "Breakfast",
      "Make a balanced start",
      "Plan meals around preferences and known allergies.",
      "Check all ingredients. Ask a clinician or dietitian about individual needs.",
    ],
    [
      "Lunch & dinner",
      "Plan the next meal",
      "Keep a varied, regular meal routine.",
      "Individual medical diets require professional guidance. Do not change prescribed care.",
    ],
    [
      "Snacks & hydration",
      "Keep your routine visible",
      "Record drinks and snacks through the day.",
      "Follow clinician guidance where fluid or dietary restrictions apply.",
    ],
  ],
  "Habits & lifestyle": [
    [
      "Rest & sleep",
      "Wind down with intention",
      "A regular routine makes sleep observations easier to track.",
      "Discuss persistent sleep problems with a clinician.",
    ],
    [
      "Hygiene & screen time",
      "Create a calm evening",
      "Build manageable daily habits.",
      "Adapt routines to age, comfort and accessibility needs.",
    ],
    [
      "Stress & routine",
      "Make a little space for yourself",
      "Keep a private reflection and one achievable goal.",
      "Seek qualified support for persistent distress.",
    ],
  ],
};
export function WellnessScreen({
  patient,
  patients,
  select,
  entries,
  save,
  search,
}: {
  patient: Patient;
  patients: Patient[];
  select: (id: string) => void;
  entries: Entry[];
  save: (e: Entry) => void;
  search: string;
}) {
  const [tab, setTab] = useState<keyof typeof wellnessContent>("Exercise");
  const completed = entries.filter(
    (e) => e.category === "wellness" && e.status === "Completed",
  ).length;
  const emergency = entries.some(
    (e) =>
      e.category === "observation" &&
      e.date === TODAY &&
      /severe chest pain|unresponsive|difficulty breathing|breathlessness|blue lips|seizure/i.test(
        `${e.title} ${e.value}`,
      ),
  );
  return (
    <>
      {emergency && (
        <div className="notice warning">
          A potentially urgent observation is recorded today. Prioritise
          professional emergency assessment using the emergency assistance
          button; do not rely on wellness activities.
        </div>
      )}
      <div className="wellness-hero">
        <Leaf size={38} />
        <div>
          <Badge>MEDVITA Remedies & Wellness Centre</Badge>
          <h2>Small rituals. A healthier everyday.</h2>
          <p>
            Educational support for movement, meals and mindful routines. No
            treatments or cures.
          </p>
        </div>
        <label>
          Wellness profile
          <select value={patient.id} onChange={(e) => select(e.target.value)}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.stage} · {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="tabs">
        {Object.keys(wellnessContent).map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t as keyof typeof wellnessContent)}
          >
            {t}
          </button>
        ))}
      </div>
      {!wellnessContent[tab].some((r) =>
        r.join(" ").toLowerCase().includes(search.toLowerCase()),
      ) && (
        <Empty text="No wellness recommendations match your search. Clear search to see this section." />
      )}
      <div className="three-col">
        {wellnessContent[tab]
          .filter((r) =>
            r.join(" ").toLowerCase().includes(search.toLowerCase()),
          )
          .map(([label, title, why, precaution]) => {
            const record = entries.find(
              (e) => e.category === "wellness" && e.title === title,
            );
            return (
              <Panel key={title} className="wellness-card">
                <span className="wellness-illustration">
                  <Leaf size={40} />
                </span>
                <Badge tone="grey">{label}</Badge>
                <h2>
                  {patient.id === "child" && tab === "Exercise"
                    ? {
                        "Gentle movement": "Supervised floor play",
                        "Balance & mobility": "Explore movement together",
                        "Strength & flexibility": "A daily play routine",
                      }[label] || title
                    : title}
                </h2>
                <p>{why}</p>
                <dl>
                  <dt>For</dt>
                  <dd>
                    {patient.stage} · {patient.name}
                  </dd>
                  <dt>Personal context</dt>
                  <dd>
                    {patient.id === "child"
                      ? "Adapt feeding and activity to developmental stage with your paediatrician."
                      : patient.id === "teen"
                        ? "Support growth, privacy and a positive body image."
                        : patient.conditions}
                  </dd>
                  <dt>Precautions</dt>
                  <dd>
                    {precaution} Allergies: {patient.allergies}.
                  </dd>
                </dl>
                <div className="chip-wrap">
                  {["Saved", "Planned", "Completed"].map((status) => (
                    <button
                      key={status}
                      disabled={emergency}
                      className={
                        record?.status === status ||
                        (status === "Saved" && record?.saved === "true") ||
                        (status === "Planned" && record?.planned === "true")
                          ? "primary"
                          : ""
                      }
                      onClick={() =>
                        save({
                          id: record?.id || uid(),
                          patient: patient.id,
                          category: "wellness",
                          title,
                          date: TODAY,
                          status:
                            record?.status === "Completed" &&
                            status !== "Completed"
                              ? "Completed"
                              : status,
                          saved:
                            status === "Saved"
                              ? "true"
                              : record?.saved || "false",
                          planned:
                            status === "Planned"
                              ? "true"
                              : record?.planned || "false",
                          source: "Patient-entered",
                          type: tab,
                          notes: why,
                        })
                      }
                    >
                      {status === "Saved" ? (
                        "Save"
                      ) : status === "Planned" ? (
                        "Add to plan"
                      ) : (
                        <>
                          <Check size={14} />
                          Complete
                        </>
                      )}
                    </button>
                  ))}
                  {record?.status === "Completed" && (
                    <button
                      onClick={() => save({ ...record, status: "Planned" })}
                    >
                      Undo completion
                    </button>
                  )}
                </div>
              </Panel>
            );
          })}
      </div>
      <Panel
        title="Your wellness plan"
        subtitle={`${completed} of 9 activities completed · Weekly wellness score: ${Math.round((completed / 9) * 100)}% (demo activity score, not a health assessment)`}
        action={
          <button
            onClick={() =>
              download(
                "medvita-monthly-wellness.txt",
                `Monthly wellness report — ${patient.name}\n${
                  entries
                    .filter((e) => e.category === "wellness")
                    .map((e) => `${e.title}: ${e.status} (${e.date})`)
                    .join("\n") || "No wellness activities logged yet."
                }`,
              )
            }
          >
            Monthly report
          </button>
        }
      >
        <progress max={9} value={completed} />
        <EntryList entries={entries.filter((e) => e.category === "wellness")} />
      </Panel>
    </>
  );
}
export function EmergencyScreen({
  patient,
  data,
  save,
  open,
  confirmation = false,
}: {
  patient: Patient;
  data: DemoData;
  save: (e: Entry) => void;
  open?: () => void;
  confirmation?: boolean;
}) {
  const [location, setLocation] = useState("Location not shared"),
    [status, setStatus] = useState("No emergency action initiated");
  const entries = data.entries.filter((e) => e.patient === patient.id);
  const caregivers = entries.filter((e) => e.category === "caregiver");
  const log = (action: string) => {
    save({
      id: uid(),
      patient: patient.id,
      category: "emergency",
      title: action,
      date: TODAY,
      status: "Demo event recorded",
      source: "Patient-entered",
      notes: `${location}. No ambulance dispatched; no external messages sent.`,
    });
    setStatus(action);
  };
  return (
    <>
      <div className="emergency-intro">
        <span className="emergency-cross">
          <Plus size={32} />
        </span>
        <h2>Help starts with a call.</h2>
        <p>
          If this is a real emergency, contact local emergency services now.
        </p>
        {confirmation ? (
          <a
            className="button danger emergency-call"
            href={`tel:${data.settings.number}`}
            onClick={() => log("Device dialler requested")}
          >
            <Phone size={22} />
            Open dialler · {data.settings.number}
          </a>
        ) : (
          <button className="danger emergency-call" onClick={open}>
            <Phone size={22} />
            SOS · CALL AMBULANCE
          </button>
        )}
        <p>
          <strong>
            This demonstration opens your device dialler. It does not dispatch
            an ambulance or confirm a connected call.
          </strong>
        </p>
        <small>
          112 is India’s integrated emergency number. 108 is regionally
          configured; check local availability.
        </small>
      </div>
      <div className="two-col">
        <Panel title="Medical emergency card">
          <h3>
            {patient.name} · {patient.age}
          </h3>
          <dl className="details-list">
            <div>
              <dt>Conditions</dt>
              <dd>{patient.conditions}</dd>
            </div>
            <div>
              <dt>Allergies</dt>
              <dd>{patient.allergies}</dd>
            </div>
            <div>
              <dt>Blood group</dt>
              <dd>{patient.blood}</dd>
            </div>
            <div>
              <dt>Current medicines</dt>
              <dd>
                {entries
                  .filter((e) => medicationActive(e))
                  .map((e) => `${e.title} ${e.strength}`)
                  .join(", ") || "None recorded"}
              </dd>
            </div>
            <div>
              <dt>Preferred hospital</dt>
              <dd>{patient.hospital}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Your emergency contacts">
          {caregivers.map((c) => (
            <div className="entry-row" key={c.id}>
              <div className="grow">
                <strong>{c.title}</strong>
                <small>{c.role}</small>
              </div>
              {c.phone ? (
                <a
                  className="button"
                  href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                  onClick={() => log(`Caregiver dialler requested: ${c.title}`)}
                >
                  Call
                </a>
              ) : (
                <Badge tone="grey">Number not configured</Badge>
              )}
            </div>
          ))}
          <button
            className="wide"
            onClick={() => {
              log("Caregivers notified (simulation only)");
              save({
                id: uid(),
                patient: patient.id,
                category: "notification",
                title: "Emergency caregiver notification (simulated)",
                date: TODAY,
                status: "Unread",
                source: "Demonstration data",
                type: "Emergency alert",
                notes: "No message was sent. Review emergency event history.",
              });
            }}
          >
            Simulate caregiver notification
          </button>
          <p className="muted">
            Configure fictional contact numbers in Caregiver Management to
            enable caller links.
          </p>
        </Panel>
      </div>
      <Panel title="Location & escalation">
        <p>
          <MapPin size={16} /> {location}
        </p>
        <button
          onClick={() => {
            if (!navigator.geolocation) {
              setLocation("Geolocation is unavailable on this device.");
              return;
            }
            setLocation("Requesting location permission…");
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                setLocation(
                  `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} · shown locally; not transmitted`,
                ),
              () =>
                setLocation(
                  "Permission denied or location unavailable. Tell emergency services your address.",
                ),
              { timeout: 10000 },
            );
          }}
        >
          Request location permission
        </button>
        <p role="status">{status}</p>
        <p className="muted">
          Location is displayed locally. Only an explicit demo event action
          records the displayed location in this browser.
        </p>
      </Panel>
      {!confirmation && (
        <Panel title="Emergency event history">
          <EntryList
            entries={entries.filter((e) => e.category === "emergency")}
          />
        </Panel>
      )}
    </>
  );
}
export function SettingsScreen({
  data,
  setData,
  reset,
  toast,
  selectPatient,
}: {
  data: DemoData;
  setData: Setter;
  reset: () => void;
  selectPatient: (id: string) => void;
  toast: (s: string) => void;
}) {
  const set = (key: keyof DemoData["settings"], value: string | boolean) => {
    setData({ ...data, settings: { ...data.settings, [key]: value } });
    toast("Preference saved.");
  };
  return (
    <div className="two-col">
      <Panel title="Workspace preferences">
        <label>
          Patient
          <select
            value={data.selected}
            onChange={(e) => selectPatient(e.target.value)}
          >
            {data.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Navigation language
          <select
            value={data.settings.language}
            onChange={(e) => set("language", e.target.value)}
          >
            {["English", "Kannada", "Hindi"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <p className="muted">
          Main navigation labels are translated. Medical content remains in
          English and is not a reviewed translation.
        </p>
        <label>
          Theme
          <select
            value={data.settings.theme}
            onChange={(e) => set("theme", e.target.value)}
          >
            <option>Light</option>
            <option>Dark</option>
          </select>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={data.settings.large}
            onChange={(e) => set("large", e.target.checked)}
          />
          Larger text and controls
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={data.settings.notifications}
            onChange={(e) => set("notifications", e.target.checked)}
          />
          Enable simulated reminder notifications
        </label>
      </Panel>
      <Panel title="Privacy & emergency preferences">
        <ShieldCheck className="teal" />
        <p>
          Fictional demonstration data stays in browser storage. This is not
          secure clinical storage or production authentication.
        </p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={data.settings.private}
            onChange={(e) => set("private", e.target.checked)}
          />
          Show adolescent confidentiality reminders
        </label>
        <p className="muted">
          Private journal and cycle entries remain excluded from shared views
          regardless of this reminder preference.
        </p>
        <label>
          Configured emergency number
          <select
            value={data.settings.number}
            onChange={(e) => set("number", e.target.value)}
          >
            <option value="112">112 · India emergency response</option>
            <option value="108">108 · Regional ambulance service</option>
          </select>
        </label>
        <p className="muted">
          Caregiver permissions can be edited in Caregiver Management. They are
          demonstrated locally, not enforced by an account service.
        </p>
      </Panel>
      <Panel title="Your demonstration data">
        <p>Export a copy before resetting. Only use fictional information.</p>
        <div className="chip-wrap">
          <button
            onClick={() =>
              download(
                "medvita-demo-data.json",
                JSON.stringify(data, null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} />
            Export demo data
          </button>
          <button className="danger" onClick={reset}>
            Reset demo data
          </button>
        </div>
      </Panel>
      <Panel title="About this workspace">
        <h3>MEDVITA</h3>
        <p>Your Health. Your Life. One Connected Ecosystem.</p>
        <Badge>Frontend demo mode</Badge>
        <p>
          AI reports, OCR samples, reminders, transfers and caregiver alerts are
          simulations. There is no connected backend, real authentication,
          clinical decision service or ambulance dispatch.
        </p>
      </Panel>
    </div>
  );
}
export function ProfileScreen({
  patient,
  data,
  setData,
  entries,
  edit,
  remove,
  add,
}: {
  patient: Patient;
  data: DemoData;
  setData: Setter;
  entries: Entry[];
  edit: (e: Entry) => void;
  remove: (e: Entry) => void;
  add: () => void;
}) {
  const [profileError, setProfileError] = useState("");
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(patient);
  return (
    <>
      <div className="profile-hero">
        <span className="avatar big">{patient.initials}</span>
        <div>
          <Badge>Fictional patient profile</Badge>
          <h2>{patient.name}</h2>
          <p>
            {patient.age} · {patient.stage} · Born {patient.dob}
          </p>
        </div>
        <button
          onClick={() => {
            setDraft(patient);
            setEditing(true);
          }}
        >
          Edit profile
        </button>
      </div>
      <div className="three-col">
        {[
          [
            "Health context",
            [
              ["Conditions", patient.conditions],
              ["Known allergies", patient.allergies],
              ["Blood group", patient.blood],
            ],
          ],
          [
            "History & lifestyle",
            [
              ["History, surgeries & family", patient.history],
              ["Lifestyle", patient.lifestyle],
            ],
          ],
          [
            "Care connections",
            [
              ["Doctor", patient.doctor],
              ["Preferred hospital", patient.hospital],
              ["Emergency contact", patient.contact],
            ],
          ],
        ].map(([title, rows]) => (
          <Panel key={String(title)} title={String(title)}>
            <dl className="details-list">
              {(rows as string[][]).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>
      <Panel
        title="Chronological medical timeline"
        action={<AddButton onClick={add} />}
      >
        <EntryList
          entries={entries
            .filter((e) =>
              ["observation", "event", "medication"].includes(e.category),
            )
            .sort((a, b) => b.date.localeCompare(a.date))}
          edit={edit}
          remove={remove}
        />
      </Panel>
      {editing && (
        <Dialog
          open
          onOpenChange={() => setEditing(false)}
          title="Edit fictional health profile"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                Object.values(draft).some((v) => !v.trim()) ||
                draft.dob > TODAY
              ) {
                setProfileError(
                  "Complete the profile and choose a birth date no later than the demo day.",
                );
                return;
              }
              setData(
                services.patients.update(data, {
                  ...draft,
                  name: draft.name.trim(),
                  age: ageLabel(draft.dob),
                }),
              );
              setEditing(false);
            }}
          >
            <div className="form-grid">
              {(
                [
                  "name",
                  "dob",
                  "blood",
                  "conditions",
                  "allergies",
                  "doctor",
                  "hospital",
                  "history",
                  "lifestyle",
                  "contact",
                ] as const
              ).map((k) => (
                <label key={k}>
                  {k === "dob"
                    ? "Date of birth"
                    : k[0].toUpperCase() + k.slice(1)}
                  <input
                    required
                    value={draft[k]}
                    type={k === "dob" ? "date" : "text"}
                    max={k === "dob" ? TODAY : undefined}
                    maxLength={500}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft({
                        ...draft,
                        [k]: value,
                        ...(k === "name"
                          ? {
                              initials: value
                                .split(" ")
                                .map((v) => v[0])
                                .join("")
                                .slice(0, 2),
                            }
                          : {}),
                        ...(k === "dob"
                          ? {
                              age: ageLabel(value),
                            }
                          : {}),
                      });
                    }}
                  />
                </label>
              ))}
            </div>
            {profileError && (
              <p className="error" role="alert">
                {profileError}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="primary">Save profile</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
