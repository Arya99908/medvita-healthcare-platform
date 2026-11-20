export type LifeStageId = "infant" | "child" | "teen-girl" | "teen-boy" | "adult" | "senior";
export type DemoMetric = { label: string; value: string; detail: string; icon: string; tone: string };
export type DemoEvent = { date: string; title: string; detail: string; type: "visit" | "medication" | "note" | "wellness" };

export type DemoProfile = {
  id: LifeStageId;
  label: string;
  category: string;
  name: string;
  age: string;
  location: string;
  initials: string;
  intro: string;
  metrics: DemoMetric[];
  careContact: string;
  sampleConditions: string[];
  sampleAllergies: string[];
  nextEvent: string;
  nextDate: string;
  note: string;
  medications: string[];
  events: DemoEvent[];
  wellness: string[];
};

export const demoProfiles: DemoProfile[] = [
  {
    id: "infant", label: "Infant", category: "BABY · SAMPLE PROFILE", name: "Anaya Sharma", age: "8 months", location: "Bengaluru", initials: "A",
    intro: "A gentle overview for feeding, rest, growth, and the little things caregivers notice.",
    metrics: [{ label: "Feedings", value: "6 today", detail: "Sample caregiver log", icon: "♡", tone: "coral" }, { label: "Sleep", value: "13.5 hrs", detail: "Last 24 hours · sample", icon: "☾", tone: "lilac" }, { label: "Next vaccine", value: "In 12 days", detail: "Reminder · sample", icon: "✳", tone: "mint" }],
    careContact: "Riya, parent", sampleConditions: ["None listed in this fictional profile"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Well-child visit", nextDate: "Sample · 01 Dec",
    note: "A calm place to keep daily notes together. Only fictional demonstration data is shown here.",
    medications: ["No sample medicines listed"],
    events: [{ date: "Today", title: "Feeding note added", detail: "Fictional caregiver entry", type: "note" }, { date: "01 Dec", title: "Well-child visit", detail: "Sample appointment", type: "visit" }],
    wellness: ["Feeding and hydration notes", "Sleep routine observations", "Growth check-in"]
  },
  {
    id: "child", label: "Child", category: "CHILD · SAMPLE PROFILE", name: "Aarav Sharma", age: "8 years", location: "Bengaluru", initials: "A",
    intro: "A clear view for growing up well, with family updates and important reminders close at hand.",
    metrics: [{ label: "Growth check", value: "On track", detail: "Sample check · 2 weeks ago", icon: "↗", tone: "mint" }, { label: "Sleep", value: "9.2 hrs", detail: "Daily average · sample", icon: "☾", tone: "lilac" }, { label: "Next vaccine", value: "In 18 days", detail: "Family reminder · sample", icon: "✳", tone: "coral" }],
    careContact: "Riya, parent", sampleConditions: ["None listed in this fictional profile"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Routine check-up", nextDate: "Sample · 12 Dec",
    note: "Keep check-ups and everyday notes together, so the care team can see what matters.",
    medications: ["No sample medicines listed"],
    events: [{ date: "Today", title: "Weekly sleep summary", detail: "Fictional demo insight", type: "wellness" }, { date: "12 Dec", title: "Routine check-up", detail: "Sample appointment", type: "visit" }],
    wellness: ["Outdoor play and movement", "Regular sleep routine", "Water breaks during the day"]
  },
  {
    id: "teen-girl", label: "Teen girl", category: "ADOLESCENT · SAMPLE PROFILE", name: "Mira Rao", age: "15 years", location: "Bengaluru", initials: "M",
    intro: "A respectful space for wellbeing, healthy habits, and private check-ins.",
    metrics: [{ label: "Mood notes", value: "4 this week", detail: "Private journal · sample", icon: "♡", tone: "coral" }, { label: "Sleep", value: "8.1 hrs", detail: "Daily average · sample", icon: "☾", tone: "lilac" }, { label: "Next visit", value: "In 12 days", detail: "Sample appointment", icon: "◷", tone: "mint" }],
    careContact: "Ananya, care provider", sampleConditions: ["None listed in this fictional profile"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Wellness check-in", nextDate: "Sample · 06 Dec",
    note: "The demo keeps sensitive notes private. In a real account, access depends on consent and applicable safeguarding rules.",
    medications: ["No sample medicines listed"],
    events: [{ date: "Today", title: "Private wellness journal", detail: "Fictional entry · private view", type: "note" }, { date: "06 Dec", title: "Wellness check-in", detail: "Sample appointment", type: "visit" }],
    wellness: ["Rest and steady sleep habits", "Movement that feels enjoyable", "Private wellness check-ins"]
  },
  {
    id: "teen-boy", label: "Teen boy", category: "ADOLESCENT · SAMPLE PROFILE", name: "Kabir Nair", age: "16 years", location: "Bengaluru", initials: "K",
    intro: "A straightforward view for everyday health, movement, and the questions that matter.",
    metrics: [{ label: "Active days", value: "5 this week", detail: "Sample activity log", icon: "↗", tone: "mint" }, { label: "Sleep", value: "8.4 hrs", detail: "Daily average · sample", icon: "☾", tone: "lilac" }, { label: "Next visit", value: "In 3 weeks", detail: "Sample appointment", icon: "◷", tone: "coral" }],
    careContact: "Arjun, care provider", sampleConditions: ["None listed in this fictional profile"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Routine check-in", nextDate: "Sample · 18 Dec",
    note: "Track sleep, movement, and how you feel in one simple place. This fictional sample is for presentation only.",
    medications: ["No sample medicines listed"],
    events: [{ date: "Today", title: "Activity summary", detail: "Fictional demo insight", type: "wellness" }, { date: "18 Dec", title: "Routine check-in", detail: "Sample appointment", type: "visit" }],
    wellness: ["Movement and active breaks", "Regular sleep routine", "Balanced meals and hydration"]
  },
  {
    id: "adult", label: "Adult", category: "ADULT · SAMPLE PROFILE", name: "Rohan Mehta", age: "38 years", location: "Bengaluru", initials: "R",
    intro: "A quick view of health details, appointments, and routines to help you stay on top of care.",
    metrics: [{ label: "Blood pressure", value: "122 / 80", detail: "Sample reading · 2 days ago", icon: "♡", tone: "coral" }, { label: "Medication", value: "Taken today", detail: "One sample reminder", icon: "✓", tone: "mint" }, { label: "Next visit", value: "In 9 days", detail: "Sample appointment", icon: "◷", tone: "lilac" }],
    careContact: "Dr. Iyer, physician", sampleConditions: ["Sample record · hypertension"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Primary care visit", nextDate: "Sample · 03 Dec",
    note: "Bring readings and notes together so conversations with your doctor feel more informed.",
    medications: ["Sample record · medication schedule", "Sample record · daily reminder"],
    events: [{ date: "Today", title: "Blood pressure recorded", detail: "Fictional sample · 122 / 80", type: "note" }, { date: "03 Dec", title: "Primary care visit", detail: "Sample appointment", type: "visit" }],
    wellness: ["Log readings as advised by your care team", "Take breaks to move during the day", "Prepare questions for your next visit"]
  },
  {
    id: "senior", label: "Senior", category: "SENIOR · SAMPLE PROFILE", name: "Lakshmi Iyer", age: "71 years", location: "Bengaluru", initials: "L",
    intro: "A calm, easy-to-read overview with helpful reminders and trusted people close by.",
    metrics: [{ label: "Blood pressure", value: "128 / 82", detail: "Sample reading · today", icon: "♡", tone: "coral" }, { label: "Medicines", value: "2 of 2", detail: "Sample reminders checked", icon: "✓", tone: "mint" }, { label: "Family check-in", value: "Today", detail: "Sample care connection", icon: "⌂", tone: "lilac" }],
    careContact: "Meera, daughter", sampleConditions: ["Sample record · hypertension", "Sample record · type 2 diabetes"], sampleAllergies: ["None listed in this fictional profile"], nextEvent: "Follow-up visit", nextDate: "Sample · 28 Nov",
    note: "Keep daily reminders and family updates together, while making space for independence.",
    medications: ["Sample record · morning schedule", "Sample record · evening schedule"],
    events: [{ date: "Today", title: "Family check-in", detail: "Fictional care update", type: "note" }, { date: "28 Nov", title: "Follow-up visit", detail: "Sample appointment", type: "visit" }],
    wellness: ["Gentle movement as appropriate", "Keep water within easy reach", "Review care plans with your clinician"]
  }
];

export const navigationItems = [
  { id: "overview", label: "Home", icon: "home" },
  { id: "timeline", label: "Health timeline", icon: "timeline" },
  { id: "medications", label: "Medicines", icon: "medications" },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "careTeam", label: "Family & care team", icon: "team" },
  { id: "wellness", label: "Wellness", icon: "wellness" },
  { id: "documents", label: "Documents", icon: "documents" },
  { id: "emergency", label: "Emergency help", icon: "emergency" },
] as const;

export type AppSection = (typeof navigationItems)[number]["id"];
