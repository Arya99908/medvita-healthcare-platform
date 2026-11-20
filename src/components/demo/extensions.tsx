"use client";
import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Activity, Check, Download, Mic, Volume2 } from "lucide-react";
import {
  type Entry,
  type Patient,
  isChildProfile,
  isTeenProfile,
  TODAY,
  download,
  dateLabel,
} from "@/lib/demo/data";
import { inRange } from "@/lib/demo/selectors";
import { Panel, Badge, EntryList, Empty } from "./ui";
import { Dialog } from "@/components/ui/dialog";

export class DemoBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="notice warning" role="alert">
        <h2>This view could not be displayed</h2>
        <p>
          Your saved browser records are retained. Try this view again or choose
          another module.
        </p>
        <button onClick={() => this.setState({ failed: false })}>
          Try again
        </button>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export function VoiceTools({
  text,
  onTranscript,
}: {
  text: string;
  onTranscript: (s: string) => void;
}) {
  const capabilities = useSyncExternalStore(
    () => () => {},
    () => {
      const w = window as unknown as {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      };
      return (
        ("speechSynthesis" in window ? 1 : 0) +
        (w.SpeechRecognition || w.webkitSpeechRecognition ? 2 : 0)
      );
    },
    () => 0,
  );
  const availability = {
    speech: !!(capabilities & 1),
    input: !!(capabilities & 2),
  };
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const active = useRef<Recognition | null>(null);
  useEffect(() => {
    return () => {
      active.current?.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  return (
    <details className="voice-tools">
      <summary>Voice accessibility · browser dependent</summary>
      <p>
        English interface reading and search dictation. Dictation may use your
        browser provider’s service; use fictional information only. Nothing
        starts until you choose a control.
      </p>
      <div className="chip-wrap">
        <button
          disabled={!availability.speech}
          onClick={() => {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-IN";
            utterance.onerror = () =>
              setMessage(
                "Speech output is unavailable. Read the on-screen text instead.",
              );
            setMessage("Reading the current page introduction.");
            speechSynthesis.speak(utterance);
          }}
        >
          <Volume2 size={15} />
          Read page introduction
        </button>
        <button
          disabled={!availability.speech}
          onClick={() => {
            speechSynthesis.cancel();
            setMessage("Reading stopped.");
          }}
        >
          Stop reading
        </button>
        <button
          disabled={!availability.input}
          onClick={() => {
            if (listening) {
              active.current?.stop();
              return;
            }
            try {
              const w = window as unknown as {
                SpeechRecognition?: new () => Recognition;
                webkitSpeechRecognition?: new () => Recognition;
              };
              const Constructor =
                w.SpeechRecognition || w.webkitSpeechRecognition;
              if (!Constructor) return;
              const r = new Constructor();
              active.current = r;
              r.lang = "en-IN";
              r.continuous = false;
              r.interimResults = false;
              r.onresult = (e) => {
                onTranscript(e.results[0][0].transcript);
                setMessage(
                  "Dictated text added to workspace search. Review it before using results.",
                );
              };
              r.onerror = (e) =>
                setMessage(
                  `Dictation unavailable (${e.error}). Use the search field instead.`,
                );
              r.onend = () => setListening(false);
              setListening(true);
              setMessage("Listening for a search phrase…");
              r.start();
            } catch {
              setListening(false);
              setMessage(
                "Dictation could not start. Use the search field instead.",
              );
            }
          }}
        >
          <Mic size={15} />
          {listening ? "Stop dictation" : "Dictate workspace search"}
        </button>
      </div>
      <small>
        Speech output:{" "}
        {availability.speech ? "browser supported" : "unavailable"}. Dictation:{" "}
        {availability.input
          ? "browser supported; permission/service required"
          : "unavailable in this browser"}
        .
      </small>
      <p role="status">{message}</p>
    </details>
  );
}
export function HistoryScreen({
  hospital,
  entries,
  documents,
  add,
  edit,
  remove,
}: {
  hospital: boolean;
  entries: Entry[];
  documents: Entry[];
  add: (category: string, extra?: Partial<Entry>) => void;
  edit: (e: Entry) => void;
  remove: (e: Entry) => void;
}) {
  const [filter, setFilter] = useState("All records");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [attachment, setAttachment] = useState<Entry | null>(null);
  const categories = [
    "observation",
    "event",
    "medication",
    "document",
    "administration",
    "handover",
  ];
  const hospitalMatch = (e: Entry) =>
    /hospital|admission|discharge|consultation|clinical note|doctor instruction|laboratory|imaging|procedure/i.test(
      `${e.title} ${e.type || ""}`,
    );
  const rows = entries
    .filter(
      (e) =>
        categories.includes(e.category) &&
        (!hospital || hospitalMatch(e)) &&
        (filter === "All records" || e.category === filter) &&
        (!from || e.date >= from) &&
        (!to || e.date <= to),
    )
    .sort((a, b) =>
      `${b.date} ${b.time || ""}`.localeCompare(`${a.date} ${a.time || ""}`),
    );
  return (
    <>
      <Panel
        title={
          hospital
            ? "Visits, admissions and discharge"
            : "A connected medical timeline"
        }
        subtitle="Fictional records · event times use Asia/Kolkata (IST, UTC+05:30). Verification labels describe demo provenance only."
      >
        <div className="chip-wrap">
          <button
            className="primary"
            onClick={() =>
              add("observation", {
                title: hospital ? "Hospital admission" : "Clinical note",
              })
            }
          >
            Add {hospital ? "hospital record" : "history record"}
          </button>
          <button
            onClick={() =>
              add("event", {
                type: hospital ? "Hospital visit" : "Doctor appointment",
              })
            }
          >
            Schedule {hospital ? "hospital visit" : "appointment"}
          </button>
        </div>
        <div className="filter-grid">
          <label>
            Record category
            <select
              aria-label="Record category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["All records", ...categories].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            From date
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To date
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            onClick={() => {
              setFilter("All records");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </button>
        </div>
        {from && to && to < from ? (
          <p role="alert">End date must be on or after the start date.</p>
        ) : (
          <>
            <p className="muted">
              {rows.length} records · Each calendar event appears once in this
              timeline; recurring occurrences remain in the calendar.
            </p>
            <EntryList
              entries={rows}
              edit={edit}
              canEdit={(e) =>
                ["observation", "event", "medication", "document"].includes(
                  e.category,
                )
              }
              view={(e) =>
                setAttachment(
                  documents.find(
                    (d) => d.id === e.attachment || d.title === e.attachment,
                  ) || e,
                )
              }
              remove={remove}
            />
          </>
        )}
      </Panel>
      <Panel title="Linked documents">
        <EntryList
          entries={documents.filter((e) => !hospital || hospitalMatch(e))}
          view={setAttachment}
        />
      </Panel>
      {attachment && (
        <Dialog
          open
          onOpenChange={() => setAttachment(null)}
          title={attachment.title}
        >
          <p>
            {attachment.notes || attachment.value || "No description recorded."}
          </p>
          {attachment.file && (
            <iframe
              className="document-preview"
              title="History document preview"
              sandbox={attachment.mime === "application/pdf" ? undefined : ""}
              src={attachment.file}
            />
          )}
          <button onClick={() => setAttachment(null)}>Close</button>
        </Dialog>
      )}
    </>
  );
}
export function NotificationScreen({
  entries,
  patch,
  markAll,
}: {
  entries: Entry[];
  patch: (e: Entry, c: Record<string, string>) => void;
  markAll: () => void;
}) {
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All types");
  const rows = entries.filter(
    (e) =>
      (status === "All" || e.status === status) &&
      (type === "All types" || (e.type || "General") === type),
  );
  return (
    <Panel
      title="Your notifications"
      subtitle="Simulated in-app alerts · no external messages or background delivery"
      action={<button onClick={markAll}>Mark all as read</button>}
    >
      <div className="filter-grid">
        <label>
          Notification status
          <select
            aria-label="Notification status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["All", "Unread", "Read"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Notification type
          <select
            aria-label="Notification type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {[
              "All types",
              ...new Set(entries.map((e) => e.type || "General")),
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      {!rows.length && <Empty text="No notifications match these filters." />}
      {rows.map((e) => (
        <div className="entry-row" key={e.id}>
          <div className="grow">
            <strong>{e.title}</strong>
            <p>{e.notes}</p>
            <small>
              {dateLabel(e.date)} · {e.type || "General"}
            </small>
          </div>
          <button
            onClick={() =>
              patch(e, { status: e.status === "Unread" ? "Read" : "Unread" })
            }
          >
            {e.status === "Unread" ? "Mark as read" : "Mark unread"}
          </button>
          <Badge>{e.status}</Badge>
        </div>
      ))}
    </Panel>
  );
}
const wellnessTabs = [
  "Exercise",
  "Food & nutrition",
  "Habits & lifestyle",
] as const;
type WellnessTab = (typeof wellnessTabs)[number];
const content: Record<string, Record<WellnessTab, string[][]>> = {
  child: {
    Exercise: [
      [
        "Supervised floor play",
        "Movement",
        "Record comfortable, caregiver-supervised play.",
      ],
      [
        "Explore movement together",
        "Mobility",
        "Observe reaching and age-appropriate exploration.",
      ],
      [
        "A daily play routine",
        "Strength & flexibility",
        "Record play opportunities at the child's pace.",
      ],
    ],
    "Food & nutrition": [
      [
        "Feeding and breakfast record",
        "Breakfast",
        "Record the usual milk feed and foods already introduced.",
      ],
      [
        "Complementary meal record",
        "Lunch & dinner",
        "Record familiar age-appropriate foods and feeding observations.",
      ],
      [
        "Milk and hydration record",
        "Snacks & hydration",
        "Keep milk intake and wet-diaper observations together.",
      ],
    ],
    "Habits & lifestyle": [
      [
        "A familiar nap routine",
        "Sleep",
        "Record naps and a consistent settling routine.",
      ],
      [
        "Caregiver hygiene routine",
        "Hygiene",
        "Record handwashing and feeding-equipment care.",
      ],
      [
        "Responsive family time",
        "Connection",
        "Record quiet interaction, play and caregiver observations.",
      ],
    ],
  },
  "child-school": {
    Exercise: [
      ["Enjoyable school-day movement", "Movement", "Plan active play or a preferred sport with age-appropriate supervision."],
      ["Stretch and reset", "Flexibility", "Take comfortable movement breaks during study and screen time."],
      ["Outdoor play routine", "Strength & balance", "Record play and activity without comparing growth or performance."],
    ],
    "Food & nutrition": [
      ["A regular breakfast", "Breakfast", "Record familiar meals and food preferences."],
      ["Lunch and dinner routine", "Meals", "Plan varied meals with family input and known allergy information."],
      ["Water and snack check-in", "Hydration", "Record usual drinks and snacks; follow clinician advice for restrictions."],
    ],
    "Habits & lifestyle": [
      ["A steady bedtime routine", "Sleep", "Record sleep and routines around school days."],
      ["Everyday hygiene", "Hygiene", "Build age-appropriate self-care habits with caregiver support."],
      ["Balance study and play", "Daily routine", "Choose one manageable activity for the day."],
    ],
  },
  teen: {
    Exercise: [
      [
        "Enjoyable everyday movement",
        "Movement",
        "Plan a preferred activity such as badminton or walking.",
      ],
      [
        "Comfortable stretching break",
        "Flexibility",
        "Record a comfortable break from sitting.",
      ],
      [
        "Build confidence in movement",
        "Strength & balance",
        "Choose supported, enjoyable activity without body comparisons.",
      ],
    ],
    "Food & nutrition": [
      [
        "A regular breakfast",
        "Breakfast",
        "Plan familiar foods that fit the family's dietary preferences.",
      ],
      [
        "A varied lunch and dinner",
        "Lunch & dinner",
        "Record meals and preferences without calorie or weight targets.",
      ],
      [
        "Snack and drink check-in",
        "Snacks & hydration",
        "Choose familiar snacks and record drinks; check peanut allergy information.",
      ],
    ],
    "Habits & lifestyle": [
      [
        "A consistent bedtime",
        "Sleep",
        "Record sleep and a manageable wind-down routine.",
      ],
      [
        "A screen break and hygiene check",
        "Hygiene & screens",
        "Plan a break from screens and routine personal care.",
      ],
      [
        "A private wellbeing check-in",
        "Stress & routine",
        "Record a personal goal; keep sensitive reflections in the private adolescent journal.",
      ],
    ],
  },
  adult: {
    Exercise: [
      [
        "A comfortable walk",
        "Walking",
        "Record walking that fits your existing clinician-approved activity plan.",
      ],
      [
        "Break up desk time",
        "Mobility",
        "Plan a comfortable movement break during desk-based work.",
      ],
      [
        "Strength and flexibility education",
        "Strength & flexibility",
        "Prepare questions about appropriate activity for your next clinical review.",
      ],
    ],
    "Food & nutrition": [
      [
        "Plan a balanced breakfast",
        "Breakfast",
        "Record meals within your existing diabetes care plan.",
      ],
      [
        "Lunch and dinner planning",
        "Lunch & dinner",
        "Plan familiar meals; discuss individual dietary needs with a dietitian.",
      ],
      [
        "Hydration and snack diary",
        "Snacks & hydration",
        "Record drinks and snacks alongside your usual routine.",
      ],
    ],
    "Habits & lifestyle": [
      [
        "An evening wind-down",
        "Sleep",
        "Record a regular bedtime and sleep observations.",
      ],
      [
        "Medicine routine check-in",
        "Medication routine",
        "Review the prescribed schedule; record doses in Medication Management.",
      ],
      [
        "A manageable daily goal",
        "Stress & routine",
        "Choose one achievable routine and record progress.",
      ],
    ],
  },
  elder: {
    Exercise: [
      [
        "Supported walking routine",
        "Walking",
        "Record walking with your usual support and caregiver when needed.",
      ],
      [
        "Comfortable mobility practice",
        "Mobility",
        "Discuss suitable seated or supported movements with your clinician.",
      ],
      [
        "Balance and strength education",
        "Strength & balance",
        "Review fall prevention and appropriate supervised activity.",
      ],
    ],
    "Food & nutrition": [
      [
        "Breakfast and appetite check",
        "Breakfast",
        "Record a familiar meal, appetite and any feeding difficulty.",
      ],
      [
        "Lunch and dinner support",
        "Lunch & dinner",
        "Plan meals within existing dietary and swallowing advice.",
      ],
      [
        "Hydration observation",
        "Snacks & hydration",
        "Record intake and follow any clinician-set fluid restrictions.",
      ],
    ],
    "Habits & lifestyle": [
      [
        "Rest and sleep observations",
        "Sleep",
        "Record sleep, naps and changes to the usual routine.",
      ],
      [
        "Care and medicine check-in",
        "Medication routine",
        "Review the prescribed schedule with a caregiver.",
      ],
      [
        "Connection and daily comfort",
        "Stress & routine",
        "Record a social check-in and one achievable personal goal.",
      ],
    ],
  },
};
export function EnhancedWellness({
  patient,
  patients,
  select,
  entries,
  save,
  remove,
  search,
  section,
}: {
  patient: Patient;
  patients: Patient[];
  select: (id: string) => void;
  entries: Entry[];
  save: (e: Entry) => void;
  remove: (e: Entry) => void;
  search: string;
  section: string;
}) {
  const initial: WellnessTab =
    section === "Food & Nutrition"
      ? "Food & nutrition"
      : section === "Habits & Lifestyle"
        ? "Habits & lifestyle"
        : "Exercise";
  const [tab, setTab] = useState<WellnessTab>(initial);
  const [filter, setFilter] = useState("All recommendations");
  const [query, setQuery] = useState("");
  const [day, setDay] = useState(TODAY);
  const [period, setPeriod] = useState("Week");
  const [goal, setGoal] = useState(
    entries.find((e) => e.category === "wellness-goal" && e.type === initial)
      ?.value || "3",
  );
  const preference = entries.find((e) => e.category === "wellness-preference");
  const [diet, setDiet] = useState(
    preference?.value || "No preference recorded",
  );
  const [goalText, setGoalText] = useState(
    entries.find((e) => e.category === "wellness-goal" && e.type === initial)
      ?.notes || "",
  );
  const catalogue =
    content[patient.id] ||
    (isChildProfile(patient.id)
      ? content.child
      : isTeenProfile(patient.id)
        ? content.teen
        : content.adult);
  const logs = entries.filter(
    (e) => e.category === "wellness-log" && e.type === tab,
  );
  const count = logs.filter(
    (e) =>
      e.status === "Completed" &&
      inRange(e, period === "Day" ? 1 : period === "Week" ? 7 : 30),
  ).length;
  const savedGoal = entries.find(
    (e) => e.category === "wellness-goal" && e.type === tab,
  );
  const urgent = entries.some(
    (e) =>
      e.category === "observation" &&
      e.date === TODAY &&
      /severe chest pain|unresponsive|difficulty breathing|breathlessness|blue lips|seizure/i.test(
        `${e.title} ${e.value}`,
      ),
  );
  const rows = catalogue[tab].filter(([title, label, why]) => {
    const record = entries.find(
      (e) => e.category === "wellness" && e.title === title,
    );
    return (
      `${title} ${label} ${why}`
        .toLowerCase()
        .includes(`${search} ${query}`.trim().toLowerCase()) &&
      (filter === "All recommendations" ||
        (filter === "Saved" && record?.saved === "true") ||
        (filter === "In my plan" && record?.planned === "true") ||
        (filter === "Completed on selected date" &&
          logs.some(
            (e) =>
              e.title === title && e.date === day && e.status === "Completed",
          )))
    );
  });
  return (
    <>
      <div className="wellness-hero">
        <Activity size={34} />
        <div>
          <Badge>Educational demonstration · {patient.stage}</Badge>
          <h2>
            {section === "Remedies & Wellness"
              ? "Your everyday wellness centre"
              : section}
          </h2>
          <p>
            Movement, meals and routines for {patient.name}. No treatments or
            cures; never replace prescribed care.
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
      {urgent && (
        <div className="notice warning">
          An urgent observation is recorded. Prioritise professional emergency
          assessment; wellness completion is paused.
        </div>
      )}
      <div className="tabs">
        {wellnessTabs.map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setFilter("All recommendations");
              const g = entries.find(
                (e) => e.category === "wellness-goal" && e.type === t,
              );
              setGoal(g?.value || "3");
              setGoalText(g?.notes || "");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <Panel title="Choose your routine">
        <div className="filter-grid">
          <label>
            Search wellness
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recommendations"
            />
          </label>
          <label>
            Recommendation filter
            <select
              aria-label="Recommendation filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                "All recommendations",
                "Saved",
                "In my plan",
                "Completed on selected date",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Tracking date
            <input
              type="date"
              max={TODAY}
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
        </div>
        <p className="muted">
          Personal context: {patient.conditions}. Reported allergies:{" "}
          {patient.allergies}. Preferences: {diet}. All suggestions require
          adaptation to existing professional advice.
        </p>
      </Panel>
      <div className="three-col">
        {rows.map(([title, label, why]) => {
          const record = entries.find(
            (e) => e.category === "wellness" && e.title === title,
          );
          const log = logs.find((e) => e.title === title && e.date === day);
          return (
            <Panel key={title} className="wellness-card">
              <Badge>{label}</Badge>
              <h2>{title}</h2>
              <h3>Why suggested</h3>
              <p>{why}</p>
              <h3>Precautions</h3>
              <p>
                {isChildProfile(patient.id)
                  ? "Caregiver supervision is essential. Ask the paediatrician about feeding readiness and developmental activities."
                  : patient.id === "elder"
                    ? "Use usual mobility support. Seek professional guidance after falls or changes in symptoms."
                    : "Stay within your comfort and existing care plan. Discuss persistent symptoms with a clinician."}{" "}
                Check allergies and any prescribed dietary or fluid
                restrictions.
              </p>
              <div className="chip-wrap">
                {["Saved", "Planned", "Completed"].map((status) => (
                  <button
                    key={status}
                    disabled={urgent || !day || day > TODAY}
                    className={
                      status === "Completed" && log?.status === "Completed"
                        ? "primary"
                        : ""
                    }
                    onClick={() => {
                      save({
                        ...record,
                        id:
                          record?.id ||
                          `wellness-${patient.id}-${tab}-${title}`,
                        patient: patient.id,
                        category: "wellness",
                        title,
                        date: TODAY,
                        source: "Patient-entered",
                        type: tab,
                        status:
                          record?.status === "Completed" ? "Completed" : status,
                        saved:
                          status === "Saved"
                            ? "true"
                            : record?.saved || "false",
                        planned:
                          status === "Planned"
                            ? "true"
                            : record?.planned || "false",
                        notes: why,
                      });
                      if (status === "Completed")
                        save({
                          id: `wellness-log-${patient.id}-${tab}-${title}-${day}`,
                          patient: patient.id,
                          category: "wellness-log",
                          title,
                          date: day,
                          type: tab,
                          status: "Completed",
                          source: "Patient-entered",
                          notes: why,
                        });
                    }}
                  >
                    {status === "Saved" ? (
                      record?.saved === "true" ? (
                        "Saved"
                      ) : (
                        "Save"
                      )
                    ) : status === "Planned" ? (
                      record?.planned === "true" ? (
                        "In plan"
                      ) : (
                        "Add to plan"
                      )
                    ) : (
                      <>
                        {" "}
                        <Check size={14} />
                        {log?.status === "Completed" ? "Completed" : "Complete"}
                      </>
                    )}
                  </button>
                ))}
                {log?.status === "Completed" && (
                  <button
                    onClick={() => {
                      save({ ...log, status: "Undone" });
                      if (
                        record &&
                        !logs.some(
                          (e) =>
                            e.title === title &&
                            e.id !== log.id &&
                            e.status === "Completed",
                        )
                      )
                        save({
                          ...record,
                          status:
                            record.planned === "true" ? "Planned" : "Saved",
                        });
                    }}
                  >
                    Undo completion
                  </button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
      {!rows.length && (
        <Empty text="No recommendations match. Clear search or change your filter." />
      )}
      <div className="two-col">
        <Panel title="Your weekly goal">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save({
                id: `wellness-goal-${patient.id}-${tab}`,
                patient: patient.id,
                category: "wellness-goal",
                title: `${tab} weekly goal`,
                type: tab,
                value: goal,
                notes: goalText,
                date: TODAY,
                status: "Planned",
                source: "Patient-entered",
              });
            }}
          >
            <label>
              Weekly activity completions
              <input
                type="number"
                min="1"
                max="21"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </label>
            <label>
              Personal goal
              <textarea
                maxLength={300}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="One achievable goal for this week"
              />
            </label>
            <button type="submit">Save weekly goal</button>
          </form>
          <p>
            {savedGoal
              ? `${savedGoal.value} completions planned · ${savedGoal.notes || "No additional notes"}`
              : "Choose your own goal; this is not a clinical activity target."}
          </p>
        </Panel>
        <Panel title="Preferences and progress">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save({
                id: `wellness-preference-${patient.id}`,
                patient: patient.id,
                category: "wellness-preference",
                title: "Dietary preference",
                date: TODAY,
                value: diet,
                status: "Saved",
                source: "Patient-entered",
              });
            }}
          >
            <label>
              Dietary preference
              <select
                aria-label="Dietary preference"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
              >
                {[
                  "No preference recorded",
                  "Vegetarian",
                  "Mixed diet",
                  "Vegan",
                  "Clinician-guided diet",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <button>Save preference</button>
          </form>
          <label>
            Tracking period
            <select
              aria-label="Tracking period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {["Day", "Week", "Month"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <p>
            <strong>{count}</strong> completions in the selected period ending{" "}
            {dateLabel(TODAY)}.
          </p>
          {period === "Week" && savedGoal && (
            <progress
              max={Number(savedGoal.value)}
              value={Math.min(count, Number(savedGoal.value))}
            />
          )}
          <button
            onClick={() =>
              download(
                "medvita-monthly-wellness.txt",
                `Monthly wellness report — ${patient.name}\nEducational activity log, not a health assessment.\n${
                  entries
                    .filter(
                      (e) => e.category === "wellness-log" && inRange(e, 30),
                    )
                    .map((e) => `${e.date}: ${e.title} — ${e.status}`)
                    .join("\n") ||
                  "No completions recorded in the last 30 days."
                }`,
              )
            }
          >
            <Download size={15} />
            Monthly report
          </button>
        </Panel>
      </div>
      <Panel title="Your wellness plan">
        <EntryList
          entries={entries.filter((e) => e.category === "wellness")}
          remove={remove}
        />
      </Panel>
      <Panel title="Daily activity history">
        <EntryList
          entries={logs.sort((a, b) => b.date.localeCompare(a.date))}
          remove={remove}
        />
      </Panel>
    </>
  );
}
