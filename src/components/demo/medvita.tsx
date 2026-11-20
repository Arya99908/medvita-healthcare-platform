"use client";
import {
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  Baby,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  House,
  Leaf,
  Menu,
  MessageSquare,
  Phone,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Users,
  VenetianMask,
  Pill,
  Accessibility,
  X,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  type DemoData,
  type Entry,
  isChildProfile,
  isTeenProfile,
  seed,
  services,
  storageKey,
  TODAY,
  dateLabel,
  reportFor,
  uid,
  download,
} from "@/lib/demo/data";
import {
  AddButton,
  Badge,
  Chart,
  EditForm,
  EntryList,
  MoreButton,
  Panel,
} from "./ui";
import {
  CalendarScreen,
  DocumentsScreen,
  SettingsScreen,
  EmergencyScreen,
  ProfileScreen,
} from "./screens";
import {
  isPrivate,
  inRange,
  medicationActive,
  upcomingEvents,
  validDemoData,
} from "@/lib/demo/selectors";
import {
  EnhancedWellness,
  HistoryScreen,
  NotificationScreen,
  VoiceTools,
  DemoBoundary,
} from "./extensions";
const subscribeViewport = (callback: () => void) => {
  const query = window.matchMedia("(max-width: 700px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const nav = [
  ["Overview", House],
  ["My Health Profile", User],
  ["Child Health", Baby],
  ["Adolescent Health", VenetianMask],
  ["Adult Health", HeartPulse],
  ["Elderly Care", Accessibility],
  ["Medical History", ClipboardList],
  ["Medical Documents", FileText],
  ["Medications", Pill],
  ["AI Health Intelligence", Sparkles],
  ["Remedies & Wellness", Leaf],
  ["Exercise", Activity],
  ["Food & Nutrition", Leaf],
  ["Habits & Lifestyle", HeartPulse],
  ["Medical Calendar", CalendarDays],
  ["Caregiver Management", Users],
  ["Doctor Dashboard", Stethoscope],
  ["Hospital Records", House],
  ["Emergency Assistance", Phone],
  ["Analytics & Reports", ChartNoAxesCombined],
  ["Notifications", Bell],
  ["Settings", Settings],
] as const;
const hindi = [
  "अवलोकन",
  "स्वास्थ्य प्रोफ़ाइल",
  "बाल स्वास्थ्य",
  "किशोर स्वास्थ्य",
  "वयस्क स्वास्थ्य",
  "बुज़ुर्ग देखभाल",
  "चिकित्सा इतिहास",
  "चिकित्सा दस्तावेज़",
  "दवाइयाँ",
  "AI स्वास्थ्य जानकारी",
  "स्वास्थ्य और तंदुरुस्ती",
  "व्यायाम",
  "भोजन और पोषण",
  "आदतें और जीवनशैली",
  "चिकित्सा कैलेंडर",
  "देखभालकर्ता प्रबंधन",
  "डॉक्टर डैशबोर्ड",
  "अस्पताल रिकॉर्ड",
  "आपातकालीन सहायता",
  "विश्लेषण और रिपोर्ट",
  "सूचनाएँ",
  "सेटिंग्स",
];
const kannada = [
  "ಅವಲೋಕನ",
  "ಆರೋಗ್ಯ ವಿವರ",
  "ಮಕ್ಕಳ ಆರೋಗ್ಯ",
  "ಹದಿಹರೆಯದ ಆರೋಗ್ಯ",
  "ವಯಸ್ಕರ ಆರೋಗ್ಯ",
  "ಹಿರಿಯರ ಆರೈಕೆ",
  "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
  "ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು",
  "ಔಷಧಿಗಳು",
  "AI ಆರೋಗ್ಯ ಮಾಹಿತಿ",
  "ಕ್ಷೇಮ ಕೇಂದ್ರ",
  "ವ್ಯಾಯಾಮ",
  "ಆಹಾರ ಮತ್ತು ಪೋಷಣೆ",
  "ಅಭ್ಯಾಸಗಳು ಮತ್ತು ಜೀವನಶೈಲಿ",
  "ವೈದ್ಯಕೀಯ ಕ್ಯಾಲೆಂಡರ್",
  "ಆರೈಕೆದಾರ ನಿರ್ವಹಣೆ",
  "ವೈದ್ಯರ ಫಲಕ",
  "ಆಸ್ಪತ್ರೆ ದಾಖಲೆಗಳು",
  "ತುರ್ತು ನೆರವು",
  "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವರದಿ",
  "ಅಧಿಸೂಚನೆಗಳು",
  "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
];
const journeys = [
  {
    name: "A growing start",
    description: "Feeding, growth and a paediatric review",
    patient: "child",
    steps: [
      "Child Health",
      "My Health Profile",
      "Analytics & Reports",
      "AI Health Intelligence",
    ],
  },
  {
    name: "Space to grow",
    description: "Private journals and adolescent wellbeing",
    patient: "teen",
    steps: ["Adolescent Health", "Remedies & Wellness", "Medical Calendar"],
  },
  {
    name: "Everyday prevention",
    description: "Vitals, medicines and long-term trends",
    patient: "adult",
    steps: ["Adult Health", "Medications", "Analytics & Reports"],
  },
  {
    name: "Care that stays connected",
    description: "Elderly care, handover and clinical review",
    patient: "elder",
    steps: [
      "Elderly Care",
      "Medical History",
      "Medications",
      "Hospital Records",
      "Caregiver Management",
      "AI Health Intelligence",
      "Doctor Dashboard",
    ],
  },
  {
    name: "One health ecosystem",
    description: "Wellness, appointments and emergency help",
    patient: "elder",
    steps: [
      "Remedies & Wellness",
      "Exercise",
      "Food & Nutrition",
      "Habits & Lifestyle",
      "Medical Calendar",
      "Hospital Records",
      "Emergency Assistance",
      "Caregiver Management",
      "Notifications",
    ],
  },
];
export default function Medvita() {
  const generation = useRef(0);
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    () => window.matchMedia("(max-width: 700px)").matches,
    () => false,
  );
  const [storageError, setStorageError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [data, setData] = useState<DemoData | null>(null);
  const [section, setSection] = useState("Overview");
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Partial<Entry> | null>(null);
  const [remove, setRemove] = useState<Entry | null>(null);
  const [modal, setModal] = useState("");
  const [report, setReport] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [chartKind, setChartKind] = useState("Blood pressure");
  const [range, setRange] = useState(14);
  const [adolescentTab, setAdolescentTab] = useState("Female wellness");
  const [journey, setJourney] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let initial: DemoData;
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      initial = validDemoData(parsed) ? parsed : seed();
      const legacy = initial.entries.filter(
        (e) =>
          e.category === "wellness" &&
          e.status === "Completed" &&
          !initial.entries.some(
            (l) =>
              l.category === "wellness-log" &&
              l.patient === e.patient &&
              l.title === e.title,
          ),
      );
      initial.entries = [
        ...initial.entries,
        ...legacy.map((e) => ({
          ...e,
          id: `migrated-${e.id}`,
          category: "wellness-log",
        })),
      ];
      if (saved && !validDemoData(parsed))
        queueMicrotask(() =>
          setToast(
            "Unreadable demo data was replaced with a fresh fictional dataset.",
          ),
        );
    } catch {
      initial = seed();
    }
    queueMicrotask(() => {
      setData(initial);
      setChartKind(
        isChildProfile(initial.selected)
          ? "Weight"
          : isTeenProfile(initial.selected)
            ? "Sleep"
            : "Blood pressure",
      );
      setAdolescentTab(initial.selected === "teen-boy" ? "Male wellness" : "Female wellness");
    });
    const readHash = () => {
      try {
        const hash = decodeURIComponent(location.hash.slice(1));
        return hash === "Medical Records" ? "Medical Documents" : hash;
      } catch {
        return "Overview";
      }
    };
    const hash = readHash();
    if (nav.some(([name]) => name === hash) || hash === "Guided Demo")
      queueMicrotask(() => setSection(hash));
    const onHash = () => {
      const s = readHash();
      if (nav.some(([name]) => name === s) || s === "Guided Demo") {
        setSection(s);
        setSearch("");
        setMobile(false);
        window.scrollTo(0, 0);
      } else if (!s) setSection("Overview");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (data) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        queueMicrotask(() => setStorageError(""));
      } catch {
        queueMicrotask(() =>
          setStorageError(
            "Changes are not persisted: browser storage is full or unavailable. Export your data before closing this page.",
          ),
        );
      }
    }
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobile(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!data)
    return (
      <div className="boot">
        <HeartPulse size={42} />
        <h1>MEDVITA</h1>
        <p>Opening your demo care workspace…</p>
      </div>
    );
  const p =
    data.patients.find((p) => p.id === data.selected) || data.patients[3];
  const all = data.entries.filter((e) => e.patient === p.id);
  const shared = all.filter((e) => !isPrivate(e));
  const analyticsEntries = shared.filter((e) => inRange(e, range));
  const visible = [
    "Caregiver Management",
    "Doctor Dashboard",
    "Overview",
    "Analytics & Reports",
    "AI Health Intelligence",
    "Emergency Assistance",
  ].includes(section)
    ? shared
    : all;
  const entries = visible.filter(
    (e) =>
      !search ||
      `${e.title} ${e.value || ""} ${e.notes || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const by = (cat: string) => entries.filter((e) => e.category === cat);
  const meds = all.filter(
    (e) =>
      e.category === "medication" &&
      (!search || e.title.toLowerCase().includes(search.toLowerCase())),
  );
  const events = upcomingEvents(all);
  const caregivers = all.filter((e) => e.category === "caregiver");
  const unread = all.filter(
    (e) => e.category === "notification" && e.status === "Unread",
  ).length;
  const go = (name: string) => {
    setSection(name);
    window.scrollTo(0, 0);
    window.history.pushState(null, "", `#${encodeURIComponent(name)}`);
    setSearch("");
    setSearchOpen(false);
    setMobile(false);
  };
  const save = (entry: Entry) => {
    setData((d) => {
      if (!d) return d;
      let next = services.save(d, entry);
      if (
        d.settings.notifications &&
        [
          "medication",
          "event",
          "document",
          "task",
          "administration",
          "wellness",
          "wellness-log",
        ].includes(entry.category)
      ) {
        next = services.save(next, {
          id: `notice-${entry.id}`,
          patient: entry.patient,
          category: "notification",
          title: `${entry.status === "Missed" ? "Missed " : ""}${entry.category === "event" ? "Calendar reminder" : entry.category === "medication" ? "Medication reminder" : entry.category === "document" ? "Document uploaded" : entry.category === "administration" ? "Medication administration" : entry.category.startsWith("wellness") ? "Wellness reminder" : "Care task updated"}: ${entry.title}`,
          date: TODAY,
          status: "Unread",
          source: "Demonstration data",
          type: entry.type || entry.category,
          notes: `${entry.status} · ${entry.date} ${entry.time || ""}. Simulated in-app notification; no message sent.`,
        });
      }
      return next;
    });
    setEditing(null);
    setToast("Record saved in this browser.");
  };
  const patch = (entry: Entry, changes: Record<string, string>) =>
    save({ ...entry, ...changes });
  const add = (category: string, extra: Partial<Entry> = {}) =>
    setEditing({ category, ...extra });
  const switchPatient = (id: string) => {
    generation.current++;
    setBusy(false);
    setData({ ...data, selected: id });
    setReport("");
    setQuery("");
    setModal("");
    setEditing(null);
    setRemove(null);
    setSearchOpen(false);
    setSearch("");
    setChartKind(
      isChildProfile(id) ? "Weight" : isTeenProfile(id) ? "Sleep" : "Blood pressure",
    );
    setAdolescentTab(id === "teen-boy" ? "Male wellness" : "Female wellness");
  };
  const latest = (kind: string) =>
    all
      .filter(
        (e) =>
          e.category === "observation" && e.title === kind && e.date <= TODAY,
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  const generate = (q: string) => {
    const token = ++generation.current;
    const patient = p,
      records = data.entries;
    setBusy(true);
    setQuery(q);
    setTimeout(() => {
      if (token !== generation.current) return;
      const output = reportFor(patient, records, q);
      setReport(output);
      setData((d) =>
        d
          ? services.save(d, {
              id: uid(),
              patient: patient.id,
              category: "report",
              title: q,
              date: TODAY,
              status: "Generated",
              source: "Demonstration AI",
              notes: output,
            })
          : d,
      );
      setBusy(false);
    }, 650);
  };
  const taken = all.filter(
    (e) =>
      e.category === "administration" &&
      e.date === TODAY &&
      e.status === "Taken",
  ).length;
  const dose = (med: Entry, time: string, status: string) => {
    const id = `dose-${med.id}-${TODAY}-${time}`;
    save({
      id,
      patient: p.id,
      category: "administration",
      title: med.title,
      date: TODAY,
      time,
      status,
      source:
        section === "Caregiver Management"
          ? "Caregiver-entered"
          : "Patient-entered",
      caregiver: caregivers[0]?.title || "Self",
      notes: `${time} administration marked ${status.toLowerCase()}`,
    });
  };
  const medList = (full = false) => (
    <>
      {!meds.some((m) => medicationActive(m)) && (
        <p className="empty">
          No active prescriptions recorded for {p.name}. Add only a fictional
          prescription to demonstrate this workflow.
        </p>
      )}
      {(full ? ["Morning", "Afternoon", "Evening", "Night"] : ["Today"]).map(
        (period) => {
          const doses = meds
            .filter((m) => medicationActive(m))
            .flatMap((m) =>
              (m.time || "08:00")
                .split(",")
                .map((t) => ({ m, time: t.trim() })),
            )
            .filter(
              ({ time }) =>
                period === "Today" ||
                (Number(time.slice(0, 2)) < 12
                  ? "Morning"
                  : Number(time.slice(0, 2)) < 17
                    ? "Afternoon"
                    : Number(time.slice(0, 2)) < 21
                      ? "Evening"
                      : "Night") === period,
            );
          return (
            <div key={period}>
              {full && <h3 className="schedule-label">{period}</h3>}
              {doses.map(({ m, time }) => {
                const state = all.find(
                  (e) => e.id === `dose-${m.id}-${TODAY}-${time}`,
                );
                return (
                  <div className="medicine-row" key={`${m.id}-${time}`}>
                    <span className="medicine-icon">
                      <Pill size={20} />
                    </span>
                    <div className="grow">
                      <strong>
                        {m.title} <span className="muted">{m.strength}</span>
                      </strong>
                      <p>
                        {m.dosage} · {time} · {m.frequency}
                      </p>
                      {full && (
                        <small>
                          {m.doctor}
                          <br />
                          {m.notes}
                          <br />
                          {m.start} to {m.end || "Open-ended"} · Refill:{" "}
                          {m.refill || "Not recorded"}
                        </small>
                      )}
                    </div>
                    {state ? (
                      <button
                        className={`dose ${state.status === "Taken" ? "done" : ""}`}
                        onClick={() =>
                          dose(
                            m,
                            time,
                            state.status === "Taken" ? "Missed" : "Taken",
                          )
                        }
                      >
                        <Check size={14} />
                        {state.status}
                      </button>
                    ) : (
                      <button
                        className="dose"
                        onClick={() => dose(m, time, "Taken")}
                      >
                        Mark taken
                      </button>
                    )}
                    {full && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => dose(m, time, "Missed")}
                        >
                          Missed
                        </button>
                        <button onClick={() => setEditing(m)}>Edit</button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${m.title}`}
                          onClick={() => setRemove(m)}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              {full && !doses.length && (
                <small className="muted">No doses scheduled.</small>
              )}
            </div>
          );
        },
      )}
    </>
  );
  const observationPanel = (
    title = "Recent health observations",
    filter?: string[],
  ) => (
    <Panel
      title={title}
      action={<AddButton onClick={() => add("observation")} />}
    >
      <EntryList
        entries={by("observation")
          .filter((e) => !filter || filter.includes(e.title))
          .sort((a, b) => b.date.localeCompare(a.date))}
        edit={setEditing}
        remove={setRemove}
        limit={30}
      />
    </Panel>
  );
  const chartPanel = (kind = chartKind) => (
    <Panel
      title={
        kind === "Weight" && isChildProfile(p.id)
          ? "Growth observations"
          : `${kind} trend`
      }
      subtitle="Recorded measurements · synthetic demonstration data"
      action={
        <select
          aria-label="Chart range"
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      }
    >
      <Chart
        entries={kind === "Menstrual cycle duration" ? all : shared}
        kind={kind}
        days={range}
      />
    </Panel>
  );
  const headerActions = (
    <>
      <button
        onClick={() => {
          setData({
            ...data,
            settings: {
              ...data.settings,
              presentation: !data.settings.presentation,
            },
          });
          setToast(
            data.settings.presentation
              ? "Presentation mode ended."
              : "Presentation mode enabled.",
          );
        }}
      >
        <Play size={15} />
        {data.settings.presentation ? "Exit presentation" : "Presentation mode"}
      </button>
      <AddButton onClick={() => add("observation")} label="Log health record" />
    </>
  );
  let content: ReactNode;
  if (section === "Overview")
    content = (
      <>
        <div className="overview-intro">
          <div>
            <Badge>One connected care ecosystem</Badge>
            <h2>
              A little clarity.
              <br />A lot of care.
            </h2>
            <p>
              Every health detail, every person who cares.
              <br />
              Together in one place for {p.name.split(" ")[0]}.
            </p>
            <button
              className="primary"
              onClick={() => go("AI Health Intelligence")}
            >
              <Sparkles size={16} />
              Explore health insights
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="care-orbit" aria-hidden="true">
            <div className="orbit-ring ring2" />
            <div className="orbit-ring" />
            <div className="orbit-heart">
              <HeartPulse size={52} />
            </div>
            <span className="orbit-tag t1">
              <ShieldCheck size={17} />
              Continuity of care
            </span>
            <span className="orbit-tag t2">
              <Users size={17} />
              Your circle of care
            </span>
            <span className="orbit-tag t3">
              <Activity size={17} />
              Every stage of life
            </span>
          </div>
        </div>
        <div className="metric-grid">
          {(p.id === "child"
            ? ["Weight", "Feeding", "Sleep", "Height"]
            : p.id === "child-school"
              ? ["Weight", "Height", "Sleep", "Physical activity"]
              : isTeenProfile(p.id)
              ? p.id === "teen-boy"
                ? ["Sleep", "Physical activity", "Hydration", "Emotional wellbeing"]
                : ["Sleep", "Physical activity", "Hydration", "Menstrual cycle"]
              : [
                  "Blood pressure",
                  "Blood glucose",
                  "Sleep",
                  "Physical activity",
                ]
          ).map((kind, i) => {
            const e = latest(kind);
            return (
              <button
                className="metric"
                key={kind}
                onClick={() => {
                  setChartKind(kind);
                  go("Analytics & Reports");
                }}
              >
                <span className={`metric-symbol c${i}`}>
                  <Activity size={19} />
                </span>
                <span className="metric-label">{kind}</span>
                <strong>
                  {e?.value || "Recorded"} <small>{e?.unit}</small>
                </strong>
                <span className="metric-foot">
                  Latest observation <ChevronRight size={14} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="dashboard-grid">
          <div className="stack">
            {chartPanel(
              isChildProfile(p.id)
                ? "Weight"
                : isTeenProfile(p.id)
                  ? "Sleep"
                  : "Blood pressure",
            )}
            <Panel
              title="Today’s medication schedule"
              subtitle={`${taken} doses marked taken today`}
              action={
                <MoreButton onClick={() => go("Medications")}>
                  View schedule
                </MoreButton>
              }
            >
              {medList()}
            </Panel>
            <Panel
              title="Recent health events"
              action={
                <MoreButton onClick={() => go("My Health Profile")}>
                  Full timeline
                </MoreButton>
              }
            >
              <EntryList
                entries={shared
                  .filter(
                    (e) =>
                      e.category === "observation" &&
                      [
                        "Symptom",
                        "Hospital admission",
                        "Discharge",
                        "Vaccination",
                      ].includes(e.title),
                  )
                  .sort((a, b) => b.date.localeCompare(a.date))}
                limit={3}
              />
            </Panel>
          </div>
          <div className="stack">
            <Panel
              className="insight-panel"
              title="A clearer picture of your health"
              subtitle="MEDVITA health intelligence"
            >
              <Sparkles size={25} />
              <p>
                {shared.filter((e) => e.category === "observation").length}{" "}
                observations connected across your care journey. Prepare a
                concise history for your next consultation.
              </p>
              <Badge tone="grey">Demonstration AI</Badge>
              <MoreButton
                onClick={() => {
                  go("AI Health Intelligence");
                  generate("Summarise my recent health history.");
                }}
              >
                Prepare my summary
              </MoreButton>
            </Panel>
            <Panel
              title="Coming up"
              action={
                <MoreButton onClick={() => go("Medical Calendar")}>
                  Calendar
                </MoreButton>
              }
            >
              {events.slice(0, 2).map((e) => (
                <button
                  className="appointment"
                  key={e.id}
                  onClick={() => {
                    go("Medical Calendar");
                    setEditing(e);
                  }}
                >
                  <span className="date-tile">
                    {dateLabel(e.date).split(" ")[1]}
                    <strong>{dateLabel(e.date).split(" ")[0]}</strong>
                  </span>
                  <span>
                    <strong>{e.title}</strong>
                    <small>
                      {e.time} · {e.location}
                    </small>
                    <Badge tone="grey">{e.type}</Badge>
                  </span>
                </button>
              ))}
            </Panel>
            <Panel
              title="Your circle of care"
              action={
                <MoreButton onClick={() => go("Caregiver Management")}>
                  Manage
                </MoreButton>
              }
            >
              {caregivers.map((c) => (
                <div className="person-row" key={c.id}>
                  <span className="avatar small">
                    {c.title
                      .split(" ")
                      .map((v) => v[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{c.title}</strong>
                    <small>{c.role}</small>
                  </div>
                  <span className="online-dot" />
                </div>
              ))}
            </Panel>
            <Panel
              title="Pending care tasks"
              action={
                <MoreButton onClick={() => go("Caregiver Management")}>
                  View tasks
                </MoreButton>
              }
            >
              {all
                .filter((e) => e.category === "task" && e.status === "Pending")
                .map((e) => (
                  <button
                    className="appointment"
                    key={e.id}
                    onClick={() => go("Caregiver Management")}
                  >
                    <ClipboardList size={17} />
                    <span>
                      {e.title}
                      <small>{e.caregiver}</small>
                    </span>
                  </button>
                ))}
            </Panel>
            <Panel title="Small steps, lasting wellbeing">
              <Leaf className="teal" />
              <p>Build a routine around movement, meals and rest.</p>
              <MoreButton onClick={() => go("Remedies & Wellness")}>
                Your wellness plan
              </MoreButton>
            </Panel>
          </div>
        </div>
      </>
    );
  else if (section === "My Health Profile")
    content = (
      <ProfileScreen
        key={p.id}
        patient={p}
        data={data}
        setData={setData}
        entries={entries}
        edit={setEditing}
        remove={setRemove}
        add={() => add("observation")}
      />
    );
  else if (
    [
      "Child Health",
      "Adolescent Health",
      "Adult Health",
      "Elderly Care",
    ].includes(section)
  ) {
    const target =
      section === "Child Health"
        ? isChildProfile(p.id) ? p.id : "child"
        : section === "Adolescent Health"
          ? isTeenProfile(p.id) ? p.id : "teen"
          : section === "Adult Health"
            ? "adult"
            : "elder";
    const kinds =
      target === "child"
        ? [
            "Feeding",
            "Bowel movement",
            "Vomiting",
            "Urination / wet diapers",
            "Temperature",
            "Sleep",
            "Weight",
            "Height",
            "Head circumference",
            "Vaccination",
            "Milestone",
          ]
        : target === "child-school"
          ? ["Symptom", "Sleep", "Weight", "Height", "Physical activity", "Vaccination", "Milestone"]
        : isTeenProfile(target)
          ? [
              "Menstrual cycle",
              "Private journal",
              "Skin & acne",
              "Hygiene",
              "Emotional wellbeing",
              "Physical activity",
              "Nutrition",
              "Hydration",
              "Sleep",
            ]
          : [
              "Blood pressure",
              "Blood glucose",
              "Weight",
              "Sleep",
              "Physical activity",
              "Symptom",
              "Vomiting",
              "Bowel movement",
              "Temperature",
              "Pain",
              "Dizziness",
              "Falls",
              "Breathlessness",
              "Appetite",
              "Hydration",
              "Walking",
              "Mobility",
              "Preventive screening",
              "Laboratory result",
            ];
    content = (
      <>
        {p.id !== target && (
          <div className="notice">
            Viewing {p.name}. This module’s tools are available for
            demonstration.
            <button onClick={() => switchPatient(target)}>
              Switch to {data.patients.find((x) => x.id === target)?.name}
            </button>
          </div>
        )}
        {isTeenProfile(target) && (
          <>
            {data.settings.private && (
              <div className="privacy-banner">
                <ShieldCheck size={20} />
                <span>
                  Private personal view. Sensitive wellbeing and menstrual entries are
                  excluded from doctor, caregiver and shared AI views. This is a
                  local privacy simulation, not account security.
                </span>
              </div>
            )}
            <div className="tabs">
              {(target === "teen-boy"
                ? ["Male wellness", "Everyday wellbeing"]
                : ["Female wellness", "Everyday wellbeing"]
              ).map(
                (t) => (
                  <button
                    key={t}
                    className={adolescentTab === t ? "active" : ""}
                    onClick={() => setAdolescentTab(t)}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
            {adolescentTab === "Male wellness" ? (
              <Panel title="Growing at your own pace">
                <div className="education-grid">
                  {[
                    "Puberty & physical development",
                    "Skin, acne & hygiene",
                    "Sexual & reproductive health",
                    "Body image & emotional wellness",
                  ].map((t) => (
                    <details key={t}>
                      <summary>{t}</summary>
                      <p>
                        Development varies from person to person. Keep a private
                        record of questions, respect personal boundaries, and
                        discuss concerns with a qualified healthcare
                        professional. A trusted adult can help you access
                        confidential, age-appropriate care.
                      </p>
                    </details>
                  ))}
                </div>
              </Panel>
            ) : adolescentTab === "Female wellness" ? (
              <Panel
                title="Menstrual history"
                action={
                  <AddButton
                    label="Log cycle"
                    onClick={() =>
                      add("observation", { title: "Menstrual cycle" })
                    }
                  />
                }
              >
                <div className="cycle-days">
                  {Array.from({ length: 30 }, (_, i) => (
                    <button
                      key={i}
                      className={
                        all.some(
                          (e) =>
                            e.title === "Menstrual cycle" &&
                            e.date <=
                              `2026-11-${String(i + 1).padStart(2, "0")}` &&
                            (e.end || e.date) >=
                              `2026-11-${String(i + 1).padStart(2, "0")}`,
                        )
                          ? "period-day"
                          : ""
                      }
                      onClick={() =>
                        add("observation", {
                          title: "Menstrual cycle",
                          date: `2026-11-${String(i + 1).padStart(2, "0")}`,
                        })
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className="muted">
                  November 2026 · Highlighted days are recorded, not predicted.
                  Track dates, flow and symptoms. Discuss severe or persistent
                  discomfort with a clinician.
                </p>
              </Panel>
            ) : null}
          </>
        )}
        <div className="quick-log">
          <h2>What would you like to record?</h2>
          <div className="chip-wrap">
            {kinds.map((k) => (
              <button key={k} onClick={() => add("observation", { title: k })}>
                <Plus size={14} />
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="two-col">
          {chartPanel(
            isChildProfile(target)
              ? "Weight"
              : isTeenProfile(target)
                ? "Sleep"
                : "Blood pressure",
          )}
          <Panel
            title={
              target === "elder"
                ? "Care today"
                : isChildProfile(target)
                  ? target === "child"
                    ? "Growing, one day at a time"
                    : "Healthy routines for school and play"
                  : "Your next healthy step"
            }
          >
            <p>
              {target === "elder"
                ? `${p.conditions}. Coordinate medicines, observations and daily care with your family.`
                : isChildProfile(target)
                  ? target === "child"
                    ? "Bring feeding, diaper and growth observations together for the next paediatric visit. These measurements are not growth percentile assessments."
                    : "Bring school, activity, sleep and growth observations to the next paediatric visit. These measurements are not growth percentile assessments."
                  : "Record how you feel, keep a regular routine and bring questions to your next appointment."}
            </p>
            <div className="stack compact">
              <button
                onClick={() =>
                  go(
                    target === "elder"
                      ? "Caregiver Management"
                      : "Medical Calendar",
                  )
                }
              >
                {target === "elder"
                  ? "Open care tasks & handover"
                  : "Plan a consultation"}
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  go("AI Health Intelligence");
                  generate(
                    isChildProfile(target)
                      ? "Prepare a pediatric consultation report."
                      : "Compare the patient’s current symptoms with previous records.",
                  );
                }}
              >
                <Sparkles size={16} />
                Prepare demonstration summary
              </button>
            </div>
            {target === "elder" && (
              <button
                className="danger wide"
                onClick={() => setModal("emergency")}
              >
                <Phone size={18} />
                SOS · CALL AMBULANCE
              </button>
            )}
          </Panel>
        </div>
        {observationPanel("Health log", kinds)}
        {target === "elder" && (
          <Panel title="Doctor instructions & hospital history">
            <EntryList
              entries={shared.filter((e) =>
                [
                  "Clinical note",
                  "Hospital admission",
                  "Discharge",
                  "Laboratory result",
                ].includes(e.title),
              )}
            />
          </Panel>
        )}
      </>
    );
  } else if (section === "Medications")
    content = (
      <>
        <div className="notice">
          <ShieldCheck size={18} />
          Fictional prescriptions for workflow demonstration. Medication names
          and doses are not treatment advice.
        </div>
        <Panel
          title="Your daily medicines"
          subtitle="Friday, 20 November 2026"
          action={
            <AddButton label="Add medicine" onClick={() => add("medication")} />
          }
        >
          {medList(true)}
        </Panel>
        <Panel
          title="Prescription history"
          subtitle="All recorded prescriptions, including future and ended courses"
        >
          <EntryList entries={meds} edit={setEditing} remove={setRemove} />
        </Panel>
        {meds.some(
          (m, i) =>
            !m.doctor ||
            !m.strength ||
            meds.some(
              (n, j) =>
                i !== j && n.title.toLowerCase() === m.title.toLowerCase(),
            ),
        ) && (
          <div className="notice warning">
            Duplicate names or incomplete prescription details require
            professional review. No interaction checking is performed.
          </div>
        )}
        <Panel title="Administration history">
          <EntryList entries={by("administration")} />
        </Panel>
      </>
    );
  else if (section === "Medical Calendar")
    content = (
      <CalendarScreen
        key={p.id}
        entries={by("event")}
        documents={all.filter((e) => e.category === "document")}
        add={(e) => add("event", e)}
        edit={setEditing}
        patch={patch}
        remove={setRemove}
      />
    );
  else if (["Medical History", "Hospital Records"].includes(section))
    content = (
      <HistoryScreen
        key={`${p.id}-${section}`}
        hospital={section === "Hospital Records"}
        entries={entries}
        documents={all.filter((e) => e.category === "document")}
        add={add}
        edit={setEditing}
        remove={setRemove}
      />
    );
  else if (section === "Medical Documents")
    content = (
      <DocumentsScreen
        key={p.id}
        patient={p}
        entries={by("document")}
        save={save}
        edit={setEditing}
        remove={setRemove}
        toast={setToast}
      />
    );
  else if (
    [
      "Remedies & Wellness",
      "Exercise",
      "Food & Nutrition",
      "Habits & Lifestyle",
    ].includes(section)
  )
    content = (
      <EnhancedWellness
        key={`${p.id}-${section}`}
        section={section}
        remove={setRemove}
        patient={p}
        patients={data.patients}
        select={switchPatient}
        entries={all}
        save={save}
        search={search}
      />
    );
  else if (section === "Emergency Assistance")
    content = (
      <EmergencyScreen
        key={p.id}
        patient={p}
        data={data}
        save={save}
        open={() => setModal("emergency")}
      />
    );
  else if (section === "Settings")
    content = (
      <SettingsScreen
        selectPatient={switchPatient}
        data={data}
        setData={setData}
        reset={() => setModal("reset")}
        toast={setToast}
      />
    );
  else if (section === "AI Health Intelligence")
    content = (
      <>
        <div className="ai-hero">
          <span className="ai-mark">
            <Sparkles size={32} />
          </span>
          <div>
            <Badge>Longitudinal health intelligence</Badge>
            <h2>Your history. A more connected picture.</h2>
            <p>
              Organise observations, discover gaps and prepare for meaningful
              consultations.
            </p>
          </div>
        </div>
        <div className="notice">
          Deterministic frontend simulation · No live model · No diagnoses,
          prescriptions or clinical validation
        </div>
        <div className="suggestions">
          {[
            "Summarise my recent health history.",
            "Compare the patient’s current symptoms with previous records.",
            "Show the recent medication schedule.",
            "Prepare a doctor consultation report.",
            "What health information is missing?",
            "Summarise the previous hospital visits.",
            "Summarise my medical documents.",
          ].map((q) => (
            <button key={q} disabled={busy} onClick={() => generate(q)}>
              <MessageSquare size={17} />
              {q}
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        <Panel title={`Ask about ${p.name.split(" ")[0]}’s recorded history`}>
          <form
            className="ask-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) generate(query);
            }}
          >
            <input
              aria-label="AI demonstration question"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about the demonstration records…"
              required
              maxLength={300}
            />
            <button className="primary" disabled={busy}>
              {busy ? "Organising records…" : "Generate demo report"}
              <Sparkles size={16} />
            </button>
          </form>
          {busy && (
            <div className="processing" role="status">
              Connecting local observations, medicines and historical events…
            </div>
          )}
          {report && (
            <>
              <pre className="report">{report}</pre>
              <button
                onClick={() => download("medvita-demo-report.txt", report)}
              >
                <Download size={16} />
                Download report
              </button>
            </>
          )}
        </Panel>
        <Panel title="Saved demonstration reports">
          <EntryList
            entries={by("report")}
            edit={(e) => {
              setReport(e.notes);
              setQuery(e.title);
            }}
            remove={setRemove}
          />
        </Panel>
      </>
    );
  else if (section === "Caregiver Management")
    content = (
      <>
        <div className="two-col">
          <Panel
            title="Your circle of care"
            action={
              <AddButton
                label="Add caregiver"
                onClick={() => add("caregiver")}
              />
            }
          >
            <EntryList
              entries={by("caregiver")}
              edit={setEditing}
              remove={setRemove}
            />
            <p className="muted">
              Permissions are simulated. Adolescent private entries are never
              included in this shared view.
            </p>
          </Panel>
          <Panel
            title="Health handover"
            subtitle="Keep the next caregiver informed"
          >
            <p>
              Current conditions, medicines, recent symptoms, instructions,
              appointments, tasks and contacts in one handover.
            </p>
            <label>
              Transfer care to
              <select aria-label="Transfer care to" id="handover-person">
                {caregivers.map((c) => (
                  <option key={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              disabled={!caregivers.length}
              onClick={() => {
                const person = (
                  document.getElementById(
                    "handover-person",
                  ) as HTMLSelectElement
                ).value;
                const text = `HEALTH HANDOVER — ${p.name}\nAssigned to: ${person}\nConditions: ${p.conditions}\nMedicines: ${
                  all
                    .filter((e) => medicationActive(e))
                    .map((m) => `${m.title} ${m.strength} (${m.time})`)
                    .join(", ") || "None recorded"
                }\nRecent symptoms: ${shared
                  .filter((e) =>
                    ["Symptom", "Vomiting", "Bowel movement"].includes(e.title),
                  )
                  .map((e) => `${e.date}: ${e.value}`)
                  .join("; ")}\nDoctor instructions: ${
                  shared
                    .filter((e) => e.title === "Clinical note")
                    .map((e) => e.value)
                    .join("; ") || "Bring records to the next review."
                }\nAppointments: ${events.map((e) => `${e.date} ${e.title}`).join("; ")}\nPending investigations: ${
                  events
                    .filter((e) =>
                      ["Laboratory test", "Imaging test"].includes(e.type),
                    )
                    .map((e) => `${e.date}: ${e.title}`)
                    .join("; ") || "None recorded"
                }\nPending tasks: ${shared
                  .filter(
                    (e) => e.category === "task" && e.status === "Pending",
                  )
                  .map((e) => e.title)
                  .join(
                    "; ",
                  )}\nEmergency contacts: ${caregivers.map((c) => `${c.title}: ${c.phone || "Number not configured"}`).join("; ")}\nPrivate adolescent entries excluded. Simulated transfer; no message sent.`;
                save({
                  id: uid(),
                  patient: p.id,
                  category: "handover",
                  title: `Handover to ${person}`,
                  date: TODAY,
                  status: "Transferred (demo)",
                  source: "Caregiver-entered",
                  notes: text,
                });
                setReport(text);
                setModal("report");
              }}
            >
              Generate & record handover
            </button>
          </Panel>
        </div>
        <Panel
          title="Daily care tasks"
          action={
            <AddButton label="Add care task" onClick={() => add("task")} />
          }
        >
          {by("task").map((e) => (
            <div className="entry-row" key={e.id}>
              <button
                className={`check-box ${e.status === "Completed" ? "checked" : ""}`}
                aria-label={`Complete ${e.title}`}
                onClick={() =>
                  patch(e, {
                    status: e.status === "Completed" ? "Pending" : "Completed",
                  })
                }
              >
                <Check size={16} />
              </button>
              <div className="grow">
                <strong>{e.title}</strong>
                <small>
                  {e.caregiver} · {e.date}
                </small>
              </div>
              <Badge>{e.status}</Badge>
              <button onClick={() => setEditing(e)}>Edit</button>
              <button onClick={() => setRemove(e)}>Delete task</button>
            </div>
          ))}
        </Panel>
        <Panel
          title="Caregiver observations"
          action={
            <AddButton
              label="Log care observation"
              onClick={() =>
                add("observation", { source: "Caregiver-entered" })
              }
            />
          }
        >
          <EntryList
            entries={shared.filter(
              (e) =>
                e.source === "Caregiver-entered" || e.category === "handover",
            )}
            edit={(e) => {
              if (e.category === "handover") {
                setReport(e.notes);
                setModal("report");
              } else setEditing(e);
            }}
          />
        </Panel>
        <Panel title="Medication administration">{medList()}</Panel>
      </>
    );
  else if (section === "Doctor Dashboard")
    content = (
      <>
        <div className="notice">
          <Stethoscope size={20} />
          DEMO DOCTOR VIEW · Clinician-authored demo notes are distinct from AI
          summaries. Private adolescent entries are excluded.
        </div>
        <div className="patient-tabs">
          {data.patients.map((x) => (
            <button
              key={x.id}
              className={p.id === x.id ? "active" : ""}
              onClick={() => switchPatient(x.id)}
            >
              <span className="avatar small">{x.initials}</span>
              {x.name}
            </button>
          ))}
        </div>
        <div className="two-col">
          <Panel title={p.name} subtitle={`${p.age} · ${p.conditions}`}>
            <p>Allergies: {p.allergies}</p>
            <p>History: {p.history}</p>
            <div className="chip-wrap">
              <button
                onClick={() =>
                  add("observation", {
                    title: "Clinical note",
                    source: "Doctor-entered",
                  })
                }
              >
                Add clinical note
              </button>
              <button onClick={() => add("event", { type: "Follow-up" })}>
                Schedule follow-up
              </button>
              <button
                onClick={() => {
                  go("AI Health Intelligence");
                  generate("Prepare a doctor consultation report.");
                }}
              >
                AI consultation report
              </button>
              <button onClick={() => go("Medical Documents")}>
                Preview documents
              </button>
            </div>
          </Panel>
          {chartPanel(
            isChildProfile(p.id)
              ? "Weight"
              : isTeenProfile(p.id)
                ? "Sleep"
                : "Blood pressure",
          )}
        </div>
        <Panel title="Current medication list">{medList()}</Panel>
        <Panel title="Clinical timeline">
          <EntryList
            entries={shared
              .filter((e) => e.category === "observation")
              .sort((a, b) => b.date.localeCompare(a.date))}
            limit={20}
          />
        </Panel>
        <Panel title="Upcoming appointments">
          <EntryList entries={events} edit={setEditing} />
        </Panel>
      </>
    );
  else if (section === "Analytics & Reports")
    content = (
      <>
        <div className="toolbar">
          <label>
            Measurement
            <select
              value={chartKind}
              onChange={(e) => setChartKind(e.target.value)}
            >
              {[
                "Blood pressure",
                "Blood glucose",
                "Weight",
                "Sleep",
                "Physical activity",
                "Walking",
                "Feeding",
                "Height",
                "Head circumference",
                "Hydration",
                "Symptom frequency",
                "Medication adherence",
                "Wellness progress",
                "Menstrual cycle duration",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button onClick={() => window.print()}>
            <Download size={16} />
            Print / save PDF
          </button>
        </div>
        {chartPanel()}
        <div className="three-col">
          <Panel title="Medication adherence">
            <strong className="big-number">
              {
                analyticsEntries.filter(
                  (e) =>
                    e.category === "administration" && e.status === "Taken",
                ).length
              }
              <small> doses taken</small>
            </strong>
            <p>
              {
                analyticsEntries.filter(
                  (e) =>
                    e.category === "administration" && e.status === "Missed",
                ).length
              }{" "}
              missed administrations recorded.
            </p>
          </Panel>
          <Panel title="Symptom frequency">
            <strong className="big-number">
              {
                analyticsEntries.filter((e) =>
                  ["Symptom", "Vomiting", "Bowel movement", "Falls"].includes(
                    e.title,
                  ),
                ).length
              }
            </strong>
            <p>Recorded symptom entries in the selected date range.</p>
          </Panel>
          <Panel title="Wellness progress">
            <strong className="big-number">
              {
                analyticsEntries.filter(
                  (e) =>
                    e.category === "wellness-log" && e.status === "Completed",
                ).length
              }
            </strong>
            <p>Wellness activities completed.</p>
          </Panel>
        </div>
        <Panel title="Reports for your next conversation">
          <div className="chip-wrap">
            {[
              "Weekly health report",
              "Monthly health report",
              "Consultation summary",
              "Caregiver report",
              "Medication report",
            ].map((t) => (
              <button
                key={t}
                onClick={() => {
                  const days = t.startsWith("Weekly")
                    ? 7
                    : t.startsWith("Monthly")
                      ? 30
                      : range;
                  const scoped = data.entries.filter(
                    (e) =>
                      ["medication", "caregiver", "document"].includes(
                        e.category,
                      ) || inRange(e, days),
                  );
                  setReport(
                    `${t} — last ${days} days through ${TODAY}\nCurrent prescriptions and care contacts retained as context.\n${reportFor(p, scoped, t)}`,
                  );
                  setModal("report");
                }}
              >
                <FileText size={16} />
                {t}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Measurement history">
          <EntryList
            entries={analyticsEntries
              .filter(
                (e) =>
                  e.category === "observation" &&
                  (!search ||
                    `${e.title} ${e.value}`
                      .toLowerCase()
                      .includes(search.toLowerCase())),
              )
              .sort((a, b) => b.date.localeCompare(a.date))}
            edit={setEditing}
            remove={setRemove}
          />
        </Panel>
      </>
    );
  else if (section === "Notifications")
    content = (
      <NotificationScreen
        key={p.id}
        entries={by("notification")}
        patch={patch}
        markAll={() => {
          setData({
            ...data,
            entries: data.entries.map((e) =>
              e.patient === p.id && e.category === "notification"
                ? { ...e, status: "Read" }
                : e,
            ),
          });
          setToast("All notifications marked as read.");
        }}
      />
    );
  else
    content = (
      <>
        <div className="demo-intro">
          <Play size={28} />
          <h2>Five journeys. One connected ecosystem.</h2>
          <p>
            Explore the people and everyday moments at the heart of MEDVITA.
          </p>
        </div>
        <div className="journey-grid">
          {journeys.map((j, i) => (
            <button
              className="journey-card"
              key={j.name}
              onClick={() => {
                switchPatient(j.patient);
                setJourney(i);
                setStep(0);
                go(j.steps[0]);
              }}
            >
              <span>Journey 0{i + 1}</span>
              <h2>{j.name}</h2>
              <p>{j.description}</p>
              <strong>
                Start guided demo <ArrowRight size={17} />
              </strong>
            </button>
          ))}
        </div>
      </>
    );
  return (
    <div
      className={`app ${data.settings.theme === "Dark" ? "dark" : ""} ${data.settings.large ? "large-text" : ""} ${data.settings.contrast ? "high-contrast" : ""} ${data.settings.presentation ? "presentation" : ""}`}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside
        inert={isMobile && !mobile}
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <button className="brand" onClick={() => go("Overview")}>
          <span>
            <HeartPulse size={26} />
          </span>
          MEDVITA
        </button>
        <div className="workspace-label">Your connected care companion</div>
        <div className="nav-scroll">
          <nav aria-label="Main navigation">
            {nav.map(([name, Icon], i) => (
              <div key={name}>
                {[0, 2, 6, 15, 19].includes(i) && (
                  <div className="nav-heading">
                    {i === 0
                      ? "Your workspace"
                      : i === 2
                        ? "Care through every stage"
                        : i === 6
                          ? "Connected health"
                          : i === 15
                            ? "Your care network"
                            : "Workspace tools"}
                  </div>
                )}
                <button
                  className={`nav-item ${section === name ? "active" : ""}`}
                  onClick={() => go(name)}
                  aria-current={section === name ? "page" : undefined}
                  aria-label={
                    data.settings.language === "Hindi"
                      ? hindi[i]
                      : data.settings.language === "Kannada"
                        ? kannada[i]
                        : name
                  }
                >
                  <Icon size={18} />
                  <span>
                    {data.settings.language === "Hindi"
                      ? hindi[i]
                      : data.settings.language === "Kannada"
                        ? kannada[i]
                        : name}
                  </span>
                  {name === "Notifications" && unread > 0 && (
                    <span className="count">{unread}</span>
                  )}
                </button>
              </div>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <button className="guided" onClick={() => go("Guided Demo")}>
            <Play size={18} />
            <span>
              Explore the guided demo
              <small>Built around real care moments</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <div className="demo-label">
            <span className="online-dot" />
            Demo workspace · Fictional data
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            My workspace <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="topbar-right">
            <div className="global-search">
              <Search size={17} />
              <input
                aria-label="Search records and navigation"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search your workspace…"
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    setSearchOpen(false);
                  }}
                >
                  <X size={14} />
                </button>
              )}
              {search && searchOpen && (
                <div className="search-results">
                  {nav
                    .filter(([n]) =>
                      n.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map(([n]) => (
                      <button key={n} onClick={() => go(n)}>
                        {n}
                      </button>
                    ))}
                  {visible
                    .filter((e) =>
                      `${e.title} ${e.value || ""}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          if (["report", "handover"].includes(e.category)) {
                            setReport(e.notes);
                            setModal("report");
                          } else if (e.category === "administration")
                            go("Medications");
                          else if (e.category === "notification")
                            go("Notifications");
                          else if (e.category.startsWith("wellness"))
                            go("Remedies & Wellness");
                          else setEditing(e);
                          setSearch("");
                          setSearchOpen(false);
                        }}
                      >
                        {e.title} · {e.date}
                      </button>
                    ))}
                  <small>Module content is filtered by your search.</small>
                </div>
              )}
            </div>
            <button
              className="icon-button notification-icon"
              aria-label="Open notifications"
              onClick={() => go("Notifications")}
            >
              <Bell size={20} />
              {unread > 0 && <i />}
            </button>
            <span className="avatar top-avatar">KS</span>
          </div>
        </header>
        <div className="patient-bar">
          <div className="patient-context">
            <span className="avatar">{p.initials}</span>
            <div>
              <span className="muted small-label">Currently caring for</span>
              <select
                aria-label="Select patient"
                value={p.id}
                onChange={(e) => switchPatient(e.target.value)}
              >
                {data.patients.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="patient-meta">
              {p.age}
              <span>•</span>
              {p.stage} care
            </span>
            <Badge tone="grey">Fictional profile</Badge>
          </div>
          <button
            className="emergency-button"
            onClick={() => setModal("emergency")}
          >
            <Phone size={15} />
            CALL AMBULANCE
          </button>
        </div>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="date-line">
                Friday, 20 November 2026 · Demo day
              </div>
              <h1>
                {section === "Overview" ? "Your health, at a glance" : section}
              </h1>
              <p>
                {section === "Overview"
                  ? "A thoughtful overview of the people and details that matter."
                  : `${p.name} · ${p.age} · Your Health. Your Life. One Connected Ecosystem.`}
              </p>
            </div>
            <div className="heading-actions">{headerActions}</div>
          </div>
          {journey !== null && (
            <div className="journey-bar">
              <Play size={17} />
              <strong>{journeys[journey].name}</strong>
              <span>
                Step {step + 1} of {journeys[journey].steps.length}
              </span>
              <button
                onClick={() => {
                  const next = step + 1;
                  if (next < journeys[journey!].steps.length) {
                    setStep(next);
                    go(journeys[journey!].steps[next]);
                  } else {
                    setJourney(null);
                    go("Guided Demo");
                  }
                }}
              >
                {step + 1 === journeys[journey].steps.length
                  ? "Finish journey"
                  : "Next stop"}
                <ArrowRight size={15} />
              </button>
              <button
                className="icon-button"
                aria-label="End guided journey"
                onClick={() => setJourney(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {shared.some(
            (e) =>
              e.category === "observation" &&
              e.date === TODAY &&
              /severe chest pain|difficulty breathing|unresponsive|unconscious|blue lips|seizure/i.test(
                `${e.title} ${e.value}`,
              ),
          ) && (
            <div className="notice warning">
              <strong>Potentially urgent observation recorded.</strong>Seek
              emergency assessment for severe symptoms. Do not wait for AI or
              wellness guidance.
              <button className="danger" onClick={() => setModal("emergency")}>
                Emergency assistance
              </button>
            </div>
          )}
          {storageError && (
            <div className="notice warning" role="alert">
              {storageError}
              <button
                onClick={() =>
                  download(
                    "medvita-unsaved-data.json",
                    JSON.stringify(data, null, 2),
                    "application/json",
                  )
                }
              >
                Export unsaved data
              </button>
            </div>
          )}
          <DemoBoundary key={`${p.id}-${section}`}>
            <VoiceTools
              text={`${section}. ${p.name}. ${p.age}. ${p.conditions}. Fictional demonstration profile.`}
              onTranscript={setSearch}
            />
            {content}
          </DemoBoundary>
          <footer className="page-footer">
            <span>
              <HeartPulse size={15} />
              MEDVITA · Care connected, life supported.
            </span>
            <span>Frontend demonstration · No clinical services connected</span>
          </footer>
        </main>
      </div>
      {editing && (
        <EditForm
          existing={data.entries}
          key={
            editing.id || `${editing.category}-${editing.title}-${editing.date}`
          }
          entry={editing}
          patient={p}
          patients={data.patients}
          documents={data.entries.filter((e) => e.category === "document")}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {remove && (
        <Dialog
          open
          onOpenChange={() => setRemove(null)}
          title="Delete demonstration record?"
        >
          <p>
            Remove “{remove.title}” from this browser? Resetting the demo
            restores the original sample data.
          </p>
          <div className="modal-actions">
            <button onClick={() => setRemove(null)}>Keep record</button>
            <button
              className="danger"
              onClick={() => {
                setData(services.remove(data, remove.id));
                setRemove(null);
                setToast("Demonstration record deleted.");
              }}
            >
              Delete record
            </button>
          </div>
        </Dialog>
      )}
      {modal === "reset" && (
        <Dialog
          open
          onOpenChange={() => setModal("")}
          title="Reset the demo workspace?"
        >
          <p>
            This removes your local edits, uploads and reports and restores all
            four fictional profiles.
          </p>
          <div className="modal-actions">
            <button onClick={() => setModal("")}>Cancel</button>
            <button
              className="danger"
              onClick={() => {
                generation.current++;
                setBusy(false);
                setQuery("");
                setChartKind("Blood pressure");
                setRange(14);
                setData(seed());
                setModal("");
                setReport("");
                setJourney(null);
                go("Overview");
                setToast("Demo data restored.");
              }}
            >
              Reset demo data
            </button>
          </div>
        </Dialog>
      )}
      {modal === "report" && (
        <Dialog
          open
          onOpenChange={() => setModal("")}
          title="MEDVITA demonstration report"
        >
          <pre className="report">{report}</pre>
          <div className="modal-actions">
            <button onClick={() => download("medvita-report.txt", report)}>
              Download text
            </button>
            <button className="primary" onClick={() => window.print()}>
              Print / save PDF
            </button>
          </div>
        </Dialog>
      )}
      {modal === "emergency" && (
        <Dialog
          open
          onOpenChange={() => setModal("")}
          title="Emergency assistance"
        >
          <EmergencyScreen
            key={p.id}
            patient={p}
            data={data}
            save={save}
            confirmation
          />
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            aria-label="Dismiss message"
            className="icon-button"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
