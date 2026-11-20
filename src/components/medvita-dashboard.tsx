"use client";

import {
  Activity, ArrowRight, Baby, Bell, CalendarDays,
  Check, ChevronDown, ClipboardList, FileText, Heart, Home,
  Menu, MessageCircle, Plus, Search, Shield, Sparkles, Users, X, Pill, PhoneCall,
  Leaf, Download, RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { AppSection, DemoEvent, DemoProfile, demoProfiles, navigationItems } from "@/lib/demo-data";
import DailyCareLog from "@/components/daily-care-log";
import EmergencySection from "@/components/emergency-section";
import DemoAISummary from "@/components/demo-ai-summary";
import { useDisplayPreferences } from "@/components/display-preferences";

type SavedNote = { id: string; profileId: DemoProfile["id"]; message: string; createdAt: string };
type Toast = { id: number; message: string } | null;
const EMPTY_NOTES: SavedNote[] = [];
let notesCache: { raw: string | null; value: SavedNote[] } = { raw: null, value: EMPTY_NOTES };

function getNotesSnapshot(): SavedNote[] {
  const raw = window.localStorage.getItem("medvita-demo-notes");
  if (raw === notesCache.raw) return notesCache.value;
  notesCache.raw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    notesCache.value = Array.isArray(parsed) ? parsed as SavedNote[] : EMPTY_NOTES;
  } catch { notesCache.value = EMPTY_NOTES; }
  return notesCache.value;
}

function subscribeToNotes(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("medvita-demo-notes-updated", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("medvita-demo-notes-updated", onChange);
  };
}

const sectionTitles: Record<AppSection, { title: string; subtitle: string }> = {
  overview: { title: "Your health, at a glance", subtitle: "A simple overview for the people and moments that matter." },
  timeline: { title: "Health timeline", subtitle: "See important health notes and appointments in one place." },
  medications: { title: "Medicines", subtitle: "Keep medication schedules and reminders easy to follow." },
  appointments: { title: "Appointments", subtitle: "Plan ahead and keep your care team in the loop." },
  wellness: { title: "Everyday wellness", subtitle: "Small routines can make care feel easier to manage." },
  documents: { title: "Health documents", subtitle: "Keep sample records and care documents together." },
  emergency: { title: "Emergency help", subtitle: "Open your device dialer and review fictional emergency details." },
};

function IconFor({ name, size = 18 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.8, "aria-hidden": true as const };
  switch (name) {
    case "home": return <Home {...props} />;
    case "timeline": return <Activity {...props} />;
    case "medications": return <Pill {...props} />;
    case "calendar": return <CalendarDays {...props} />;
    case "wellness": return <Leaf {...props} />;
    case "documents": return <FileText {...props} />;
    case "emergency": return <PhoneCall {...props} />;
    default: return <Heart {...props} />;
  }
}

function TrendLine() {
  return <svg className="trend-line" viewBox="0 0 100 38" role="img" aria-label="Sample trend line"><path d="M2 28 C14 26, 17 17, 27 21 S41 30, 50 18 S66 14, 74 20 S89 7, 98 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M2 28 C14 26, 17 17, 27 21 S41 30, 50 18 S66 14, 74 20 S89 7, 98 9 L98 38 L2 38Z" fill="url(#chartfill)" opacity=".16" /><defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>;
}

export default function MedVitaDashboard() {
  const [profileIndex, setProfileIndex] = useState(1);
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
  const { highContrast } = useDisplayPreferences();
  const [autoPlay, setAutoPlay] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const notes = useSyncExternalStore(subscribeToNotes, getNotesSnapshot, () => EMPTY_NOTES);
  const [toast, setToast] = useState<Toast>(null);
  const [medicationTaken, setMedicationTaken] = useState<Record<string, boolean>>({});
  const [wellnessDone, setWellnessDone] = useState<Record<string, boolean>>({});
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Record<string, DemoEvent[]>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const profile = demoProfiles[profileIndex];
  const pageTitle = sectionTitles[activeSection];
  const profileNotes = useMemo(() => notes.filter((note) => note.profileId === profile.id), [notes, profile.id]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => setProfileIndex((index) => (index + 1) % demoProfiles.length), 5200);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string) { setToast({ id: Date.now(), message }); }
  function chooseProfile(index: number) { setProfileIndex((index + demoProfiles.length) % demoProfiles.length); setActiveSection("overview"); }
  function handleTabsKey(event: KeyboardEvent<HTMLDivElement>) {
    let next = profileIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (profileIndex + 1) % demoProfiles.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (profileIndex - 1 + demoProfiles.length) % demoProfiles.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = demoProfiles.length - 1;
    else return;
    event.preventDefault(); chooseProfile(next);
    document.getElementById(`profile-tab-${demoProfiles[next].id}`)?.focus();
  }
  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draftNote.trim();
    if (!message) return;
    const next: SavedNote[] = [{ id: crypto.randomUUID(), profileId: profile.id, message, createdAt: new Date().toISOString() }, ...notes];
    window.localStorage.setItem("medvita-demo-notes", JSON.stringify(next));
    window.dispatchEvent(new Event("medvita-demo-notes-updated"));
    setDraftNote(""); setModal(false); showToast("Sample note saved on this device.");
  }
  function resetDemo() {
    window.localStorage.removeItem("medvita-demo-notes");
    window.localStorage.removeItem("medvita-demo-care-logs");
    window.dispatchEvent(new Event("medvita-demo-notes-updated"));
    window.dispatchEvent(new Event("medvita-demo-reset"));
    notesCache = { raw: null, value: EMPTY_NOTES };
    setMedicationTaken({}); setWellnessDone({}); setUploadedNames([]); setAppointments({});
    setProfileIndex(1); setActiveSection("overview"); setAutoPlay(false); showToast("Demo returned to its sample starting state.");
  }
  function downloadReport() {
    const report = { label: "FICTIONAL MEDVITA DEMONSTRATION REPORT", exportedAt: new Date().toISOString(), profile: { name: profile.name, stage: profile.category, age: profile.age }, sampleMetrics: profile.metrics, sampleTimeline: [...profile.events, ...profileNotes.map((n) => ({ date: n.createdAt, title: n.message, detail: "Local demo note", type: "note" }))] };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `medvita-sample-${profile.id}-report.json`; link.click(); URL.revokeObjectURL(url);
    showToast("Fictional sample report downloaded.");
  }
  function addSampleAppointment() {
    const next = { date: "New sample", title: "Demo follow-up", detail: "Fictional local appointment", type: "visit" as const };
    setAppointments((items) => ({ ...items, [profile.id]: [next, ...(items[profile.id] ?? [])] }));
    showToast("Sample appointment added to this demo view.");
  }
  function setSection(section: AppSection) { setActiveSection(section); setMobileMenu(false); }

  return (
    <div className={`app-shell${highContrast ? " high-contrast" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#main" aria-label="MedVita home"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></a>
        <div className="topbar-center"><span className="topbar-context">FAMILY HEALTH SPACE</span><span className="topbar-separator">/</span><span className="topbar-context current-context">DEMO OVERVIEW</span></div>
        <div className="topbar-actions">
          <span className="topbar-divider" />
          <button className="emergency-shortcut" type="button" onClick={() => setSection("emergency")} aria-label="Open emergency options"><PhoneCall size={16} /><span>Emergency</span></button>
          <Link className="user-chip" href="/account" aria-label="Open your account"><div className="user-avatar"><Users size={16} aria-hidden="true" /></div><span>My account</span><ChevronDown size={14} aria-hidden="true" /></Link>
          <button className="icon-button mobile-menu-button" type="button" onClick={() => setMobileMenu((v) => !v)} aria-expanded={mobileMenu} aria-label={mobileMenu ? "Close menu" : "Open menu"}>{mobileMenu ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar${mobileMenu ? " open" : ""}`} aria-label="Main menu">
          <div className="space-label">YOUR SPACE</div>
          <div className="patient-switcher"><span className="switcher-avatar">{profile.initials}</span><span className="switcher-copy"><strong>{profile.name}</strong><small>{profile.label} · {profile.age}</small></span><ChevronDown size={15} aria-hidden="true" /></div>
          <nav className="sidebar-nav" aria-label="Health sections">
            {navigationItems.map((item) => <button key={item.id} type="button" className={`nav-item${activeSection === item.id ? " selected" : ""}${item.id === "emergency" ? " emergency-nav" : ""}`} onClick={() => setSection(item.id)} aria-current={activeSection === item.id ? "page" : undefined}><IconFor name={item.icon} /><span>{item.label}</span>{item.id === "appointments" && <span className="nav-count">2</span>}</button>)}
          </nav>
          <div className="sidebar-bottom"><div className="privacy-card"><div className="privacy-icon"><Shield size={17} /></div><div><strong>Your privacy matters</strong><p>Demo data stays on this device.</p></div></div><button className="reset-button" type="button" onClick={resetDemo}><RotateCcw size={15} /> Reset demo data</button></div>
        </aside>

        <main className="main-content" id="main">
          <div className="content-wrap">
            <div className="breadcrumb"><span>Family health</span><span className="crumb-slash">/</span><strong>{pageTitle.title}</strong></div>
            <div className="page-heading-row"><div><div className="greeting">{activeSection === "overview" ? "Good morning" : profile.label + " profile"}<span className="greeting-sparkle">✦</span></div><h1>{pageTitle.title}</h1><p>{pageTitle.subtitle}</p></div><div className="heading-actions"><span className="demo-pill"><span /> Fictional demo</span><button className="primary-button small-button" type="button" onClick={() => setModal(true)}><Plus size={16} /> Add a health note</button></div></div>

            <section className="stage-panel" aria-labelledby="stage-title">
              <div className="stage-panel-top"><div><div className="micro-label">PRESENTATION MODE</div><h2 id="stage-title">Explore care through every stage</h2><p>Switch sample profiles to see how MedVita adapts.</p></div><button type="button" className={`walkthrough-button${autoPlay ? " playing" : ""}`} onClick={() => setAutoPlay((value) => !value)} aria-pressed={autoPlay}>{autoPlay ? <><span className="pause-symbol">Ⅱ</span> Pause walkthrough</> : <><span className="play-symbol">▶</span> Auto walkthrough</>}</button></div>
              <div className="stage-tabs" role="tablist" aria-label="Choose fictional life-stage profile" onKeyDown={handleTabsKey}>
                {demoProfiles.map((item, index) => <button key={item.id} id={`profile-tab-${item.id}`} type="button" role="tab" aria-selected={index === profileIndex} aria-controls="profile-overview" tabIndex={index === profileIndex ? 0 : -1} className={`stage-tab${index === profileIndex ? " active" : ""}`} onClick={() => { chooseProfile(index); setAutoPlay(false); }}><span className={`stage-tab-icon stage-${item.id}`} aria-hidden="true">{item.id === "infant" ? <Baby size={17} /> : item.id === "senior" ? <Heart size={16} /> : item.id.startsWith("teen") ? <Sparkles size={16} /> : item.id === "adult" ? <Activity size={16} /> : <Leaf size={16} />}</span><span>{item.label}</span></button>)}
              </div>
            </section>

            {activeSection === "overview" && <OverviewSection profile={profile} profileNotes={profileNotes} onAddNote={() => setModal(true)} onDownload={downloadReport} onSection={setSection} appointments={appointments[profile.id] ?? []} />}
            {activeSection === "timeline" && <TimelineSection profile={profile} notes={profileNotes} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
            {activeSection === "medications" && <MedicationSection profile={profile} taken={medicationTaken} setTaken={setMedicationTaken} />}
            {activeSection === "appointments" && <AppointmentSection profile={profile} appointments={appointments[profile.id] ?? []} onAdd={addSampleAppointment} />}
            {activeSection === "wellness" && <WellnessSection profile={profile} done={wellnessDone} setDone={setWellnessDone} />}
            {activeSection === "documents" && <DocumentSection uploadedNames={uploadedNames} setUploadedNames={setUploadedNames} />}
            {activeSection === "emergency" && <EmergencySection profile={profile} />}

            <div className="footer-note"><Shield size={15} /><span>This prototype uses fictional sample data. It is not a medical record and does not provide medical advice.</span><button type="button" onClick={downloadReport}>Export sample report <Download size={14} /></button></div>
          </div>
        </main>
      </div>

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title"><div className="modal-heading"><div><span className="micro-label">LOCAL DEMO ONLY</span><h2 id="note-modal-title">Add a health note</h2></div><button className="icon-button" onClick={() => setModal(false)} aria-label="Close dialog"><X size={18} /></button></div><p>This note is saved only in this browser and is not sent to a server.</p><form onSubmit={saveNote}><label htmlFor="health-note">What would you like to remember?</label><textarea id="health-note" rows={4} maxLength={500} value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Add a short note for this sample profile…" required /><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button small-button" type="submit"><Check size={16} /> Save sample note</button></div></form></section></div>}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{toast?.message ?? ""}</div>
      {toast && <div className="toast" key={toast.id}><Check size={16} /> {toast.message}</div>}
    </div>
  );
}

function OverviewSection({ profile, profileNotes, onAddNote, onDownload, onSection, appointments }: { profile: DemoProfile; profileNotes: SavedNote[]; onAddNote: () => void; onDownload: () => void; onSection: (section: AppSection) => void; appointments: DemoEvent[] }) {
  return <section id="profile-overview" role="tabpanel" aria-labelledby={`profile-tab-${profile.id}`} className="profile-view">
    <div className="profile-banner"><div className="profile-id"><div className={`large-avatar avatar-${profile.id}`}>{profile.initials}</div><div><div className="profile-category">{profile.category}</div><h2>{profile.name}</h2><div className="profile-meta">{profile.age}<span>·</span>{profile.location}<span>·</span><span className="verified-label"><span /> Synthetic profile</span></div></div></div><div className="support-label"><Users size={16} /><span>Care connection</span><strong>{profile.careContact}</strong></div><button className="more-button" type="button" aria-label="Download this profile's sample report" onClick={onDownload}><Download size={17} /></button></div>
    <div className="overview-grid"><div className="overview-main"><div className="welcome-card"><div className="welcome-copy"><span className="micro-label">YOUR WEEKLY SNAPSHOT</span><h3>{profile.intro}</h3><p>{profile.note}</p><button type="button" className="text-button" onClick={() => onSection("timeline")}>View health timeline <ArrowRight size={15} /></button></div><div className="welcome-art" aria-hidden="true"><div className="welcome-orbit" /><div className="welcome-orbit second" /><span className="welcome-plus">+</span><span className="welcome-leaf leaf-a" /><span className="welcome-leaf leaf-b" /></div></div>
      <div className="metric-grid">{profile.metrics.map((metric, index) => <article className="metric-card" key={metric.label}><div className="metric-top"><span className={`metric-icon ${metric.tone}`}>{metric.icon}</span><span className="metric-label">{metric.label}</span><span className="metric-menu" aria-hidden="true">···</span></div><div className="metric-value">{metric.value}</div><div className="metric-detail">{metric.detail}</div>{index === 0 && <TrendLine />}</article>)}</div>
      <div className="card timeline-card"><div className="card-heading"><div><span className="micro-label">RECENT ACTIVITY</span><h3>Health timeline</h3></div><button className="text-button" type="button" onClick={() => onSection("timeline")}>See all <ArrowRight size={15} /></button></div><div className="timeline-list">{[...profile.events, ...profileNotes.map((note) => ({ date: new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), title: note.message, detail: "Local sample note", type: "note" as const }))].slice(0, 4).map((event, index) => <TimelineRow key={`${event.title}-${index}`} event={event} />)}</div></div>
    </div><aside className="overview-side"><div className="card next-card"><div className="card-heading"><div><span className="micro-label">UP NEXT</span><h3>Coming up</h3></div><span className="calendar-icon"><CalendarDays size={18} /></span></div><div className="appointment-highlight"><div className="date-tile"><span>DEC</span><strong>{profile.nextDate.match(/\d+/)?.[0] ?? "12"}</strong></div><div><strong>{profile.nextEvent}</strong><small>{profile.nextDate}</small></div></div><div className="side-rule" /><div className="care-contact"><div className="contact-avatar">{profile.careContact.charAt(0)}</div><div><small>CARE CONNECTION</small><strong>{profile.careContact}</strong></div><MessageCircle size={17} /></div><button type="button" className="secondary-button full-button" onClick={() => onSection("appointments")}>Open appointments <ArrowRight size={15} /></button></div>
      <div className="card wellness-card"><div className="card-heading"><div><span className="micro-label">GENTLE REMINDER</span><h3>Wellness, your way</h3></div><span className="wellness-icon"><Heart size={18} /></span></div><p>{profile.wellness[0]}. Keep simple observations together with your care team.</p><button type="button" className="text-button" onClick={() => onSection("wellness")}>Explore wellness <ArrowRight size={15} /></button></div>
      <DemoAISummary key={profile.id} profile={profile} />
      <div className="quick-actions"><button type="button" onClick={onAddNote}><Plus size={16} /> Add a note</button><button type="button" onClick={onDownload}><Download size={16} /> Export sample</button></div>
      {appointments.length > 0 && <p className="sample-count">{appointments.length} additional local sample appointment{appointments.length > 1 ? "s" : ""}.</p>}
    </aside></div>
  </section>;
}

function TimelineRow({ event }: { event: DemoEvent }) {
  const Icon = event.type === "visit" ? CalendarDays : event.type === "medication" ? Pill : event.type === "wellness" ? Leaf : ClipboardList;
  return <div className="timeline-row"><div className={`timeline-marker ${event.type}`}><Icon size={15} /></div><div className="timeline-row-copy"><strong>{event.title}</strong><small>{event.detail}</small></div><span className="timeline-date">{event.date}</span></div>;
}

function TimelineSection({ profile, notes, searchTerm, setSearchTerm }: { profile: DemoProfile; notes: SavedNote[]; searchTerm: string; setSearchTerm: (value: string) => void }) {
  const items = [...profile.events, ...notes.map((note) => ({ date: new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), title: note.message, detail: "Saved locally in this demo", type: "note" as const }))].filter((event) => `${event.title} ${event.detail}`.toLowerCase().includes(searchTerm.toLowerCase()));
  return <section className="section-card"><div className="card-heading"><div><span className="micro-label">FICTIONAL SAMPLE</span><h2>{profile.name}&apos;s health timeline</h2><p>Entries are sample data or notes saved only in this browser.</p></div><label className="search-box"><Search size={16} /><input aria-label="Search timeline" placeholder="Search this timeline" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label></div><div className="timeline-list full-timeline">{items.length ? items.map((event, index) => <TimelineRow key={`${event.title}-${index}`} event={event} />) : <EmptyState title="No matching notes" detail="Try another search term." />}</div></section>;
}

function MedicationSection({ profile, taken, setTaken }: { profile: DemoProfile; taken: Record<string, boolean>; setTaken: (update: (state: Record<string, boolean>) => Record<string, boolean>) => void }) {
  return <section className="section-card"><div className="card-heading"><div><span className="micro-label">SAMPLE MEDICATION LIST</span><h2>{profile.name}&apos;s medicines</h2><p>Fictional reminders only. This demo does not prescribe or change medicines.</p></div><span className="medication-header-icon"><Pill size={19} /></span></div><div className="medicine-list">{profile.medications.map((name, index) => { const key = `${profile.id}-${index}`; const isEmpty = name.startsWith("No sample"); return <article className="medicine-row" key={key}><span className="medicine-icon"><Pill size={17} /></span><div className="medicine-info"><strong>{name}</strong><small>{isEmpty ? "No fictional medicine schedule has been added." : index === 0 ? "Sample schedule · morning" : "Sample schedule · evening"}</small></div>{!isEmpty && <button type="button" className={`taken-button${taken[key] ? " taken" : ""}`} onClick={() => setTaken((state) => ({ ...state, [key]: !state[key] }))}>{taken[key] ? <><Check size={14} /> Sample marked taken</> : "Mark sample taken"}</button>}</article>; })}</div><div className="info-callout"><Shield size={17} /><p>Medication records in this prototype are fictional. Always follow instructions from a qualified healthcare professional.</p></div></section>;
}

function AppointmentSection({ profile, appointments, onAdd }: { profile: DemoProfile; appointments: DemoEvent[]; onAdd: () => void }) {
  return <section className="section-card"><div className="card-heading"><div><span className="micro-label">SAMPLE CARE CALENDAR</span><h2>Appointments for {profile.name}</h2><p>Appointments shown here are fictional demo entries.</p></div><button className="primary-button small-button" type="button" onClick={onAdd}><Plus size={16} /> Add sample visit</button></div><div className="timeline-list full-timeline"><TimelineRow event={{ date: profile.nextDate, title: profile.nextEvent, detail: "Fictional upcoming appointment", type: "visit" }} />{appointments.map((event, index) => <TimelineRow key={index} event={event} />)}{profile.events.filter((event) => event.type === "visit").map((event, index) => <TimelineRow key={`old-${index}`} event={event} />)}</div><div className="info-callout"><Bell size={17} /><p>Calendar and notification connections are not configured in this demo.</p></div></section>;
}

function WellnessSection({ profile, done, setDone }: { profile: DemoProfile; done: Record<string, boolean>; setDone: (update: (state: Record<string, boolean>) => Record<string, boolean>) => void }) {
  return <><section className="section-card"><div className="card-heading"><div><span className="micro-label">SMALL STEPS, AT YOUR PACE</span><h2>Wellness for {profile.label.toLowerCase()}s</h2><p>Fictional, general wellbeing reminders. Not personalized medical guidance.</p></div><span className="wellness-icon large"><Heart size={19} /></span></div><div className="habit-list">{profile.wellness.map((habit) => <label className="habit-row" key={habit}><input type="checkbox" checked={Boolean(done[`${profile.id}-${habit}`])} onChange={(event) => setDone((state) => ({ ...state, [`${profile.id}-${habit}`]: event.target.checked }))} /><span className="custom-check"><Check size={14} /></span><span>{habit}</span><small>Sample idea</small></label>)}</div><div className="info-callout"><Heart size={17} /><p>Choose routines that feel comfortable. Ask a clinician about activity or diet changes when medical conditions or restrictions apply.</p></div></section><DailyCareLog profile={profile} /></>;
}

function DocumentSection({ uploadedNames, setUploadedNames }: { uploadedNames: string[]; setUploadedNames: (update: (names: string[]) => string[]) => void }) {
  return <section className="section-card"><div className="card-heading"><div><span className="micro-label">PRIVATE FILES · DEMO</span><h2>Health documents</h2><p>Sample file names stay in this page only; no files are uploaded to cloud storage.</p></div><span className="document-header-icon"><FileText size={19} /></span></div><label className="upload-zone"><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => { const files = Array.from(event.target.files ?? []).map((file) => file.name); if (files.length) setUploadedNames((names) => [...names, ...files]); event.currentTarget.value = ""; }} /><span className="upload-icon"><Plus size={21} /></span><strong>Select demo files</strong><small>PDF or image · file names are shown locally only</small></label><div className="document-list">{uploadedNames.map((name, index) => <div className="document-row" key={`${name}-${index}`}><FileText size={17} /><span>{name}</span><span className="local-badge">LOCAL DEMO</span><button type="button" className="remove-file" aria-label={`Remove ${name}`} onClick={() => setUploadedNames((items) => items.filter((_, i) => i !== index))}><X size={16} /></button></div>)}</div><div className="info-callout"><Shield size={17} /><p>Secure cloud storage and document processing are not enabled. Do not select real patient records in this prototype.</p></div></section>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><ClipboardList size={24} /><strong>{title}</strong><span>{detail}</span></div>; }
