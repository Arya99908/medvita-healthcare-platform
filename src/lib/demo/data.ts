import { isPrivate, inRange } from "./selectors";
export type Patient = {
  id: string;
  name: string;
  initials: string;
  age: string;
  stage: string;
  dob: string;
  blood: string;
  conditions: string;
  allergies: string;
  doctor: string;
  hospital: string;
  history: string;
  lifestyle: string;
  contact: string;
};
export type Entry = {
  id: string;
  patient: string;
  category: string;
  title: string;
  date: string;
  status: string;
  source: string;
  [key: string]: string;
};
export type Settings = {
  language: string;
  theme: string;
  large: boolean;
  private: boolean;
  notifications: boolean;
  number: string;
  presentation: boolean;
};
export type DemoData = {
  patients: Patient[];
  entries: Entry[];
  settings: Settings;
  selected: string;
};
export { TODAY } from "./constants";
import { TODAY } from "./constants";
export const uid = () => crypto.randomUUID();
export const dateLabel = (date: string) =>
  new Date(date.slice(0, 10) + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
export const patients: Patient[] = [
  {
    id: "child",
    name: "Aarav Sharma",
    initials: "AS",
    age: "9 months",
    stage: "Child",
    dob: "2026-02-20",
    blood: "Not verified",
    conditions: "No recorded conditions",
    allergies: "None reported; verification pending",
    doctor: "Dr. Nisha Rao · Paediatrics",
    hospital: "Demo Children’s Clinic, Bengaluru",
    history: "Routine newborn review; no surgeries recorded",
    lifestyle: "Mixed feeding, supervised play, regular naps",
    contact: "Kavya Sharma · primary caregiver",
  },
  {
    id: "teen",
    name: "Ananya Sharma",
    initials: "AN",
    age: "16 years",
    stage: "Adolescent",
    dob: "2010-08-24",
    blood: "Not verified",
    conditions: "No recorded conditions",
    allergies: "Peanuts (reported)",
    doctor: "Dr. Nisha Rao · Adolescent health",
    hospital: "Demo Family Clinic, Bengaluru",
    history: "Annual review in August; no surgeries recorded",
    lifestyle: "School badminton, vegetarian preferences",
    contact: "Kavya Sharma · parent",
  },
  {
    id: "adult",
    name: "Priya Sharma",
    initials: "PS",
    age: "42 years",
    stage: "Adult",
    dob: "1984-06-18",
    blood: "O+ · verified in fictional record",
    conditions: "Hypertension",
    allergies: "Penicillin (reported)",
    doctor: "Dr. Meera Rao · Internal medicine",
    hospital: "Demo City Hospital, Bengaluru",
    history:
      "Hypertension review, October 2026; family history of hypertension; no surgery recorded",
    lifestyle: "Desk-based work, evening walks, mixed diet",
    contact: "Kavya Sharma · sister",
  },
  {
    id: "elder",
    name: "Rajesh Sharma",
    initials: "RS",
    age: "72 years",
    stage: "Elderly",
    dob: "1954-04-09",
    blood: "B+ · verified in fictional record",
    conditions: "Hypertension, Type 2 diabetes",
    allergies: "Sulfonamides (reported)",
    doctor: "Dr. Meera Rao · Internal medicine",
    hospital: "Demo City Hospital, Bengaluru",
    history:
      "Observation admission, 12 October; discharged 14 October. Cataract surgery, 2022. Family history of diabetes.",
    lifestyle: "Assisted morning walks, regular meals, afternoon rest",
    contact: "Kavya Sharma · daughter",
  },
];
export const observationTypes = [
  "Blood pressure",
  "Blood glucose",
  "Weight",
  "Height",
  "Head circumference",
  "Temperature",
  "Sleep",
  "Physical activity",
  "Symptom",
  "Feeding",
  "Bowel movement",
  "Vomiting",
  "Urination / wet diapers",
  "Vaccination",
  "Milestone",
  "Menstrual cycle",
  "Private journal",
  "Skin & acne",
  "Hygiene",
  "Emotional wellbeing",
  "Pain",
  "Dizziness",
  "Falls",
  "Breathlessness",
  "Appetite",
  "Hydration",
  "Walking",
  "Mobility",
  "Nutrition",
  "Care task",
  "Clinical note",
  "Hospital admission",
  "Discharge",
  "Laboratory result",
  "Surgery",
  "Family history",
  "Preventive screening",
];
export const eventTypes = [
  "Doctor appointment",
  "Hospital visit",
  "Hospital admission",
  "Discharge",
  "Laboratory test",
  "Imaging test",
  "Vaccination",
  "Follow-up",
  "Medicine schedule",
  "Refill reminder",
  "Exercise session",
  "Wellness activity",
  "Caregiver visit",
  "Nursing visit",
  "Therapy session",
  "Procedure",
  "Other",
];
export function seed(): DemoData {
  const entries: Entry[] = [];
  const add = (
    patient: string,
    category: string,
    title: string,
    date = TODAY,
    extra: Record<string, string> = {},
  ) =>
    entries.push({
      id: uid(),
      patient,
      category,
      title,
      date,
      status: "Recorded",
      source: "Demonstration data",
      ...extra,
    });
  for (const p of patients) {
    for (let i = 0; i < 14; i++) {
      const date = `2026-11-${String(i + 7).padStart(2, "0")}`;
      const measures =
        p.id === "child"
          ? [
              ["Weight", (7.6 + i * 0.025).toFixed(2), "kg"],
              ["Feeding", String(100 + (i % 3) * 10), "ml"],
              ["Sleep", String(13 + (i % 2)), "hours"],
            ]
          : p.id === "teen"
            ? [
                ["Sleep", String(7 + (i % 3) * 0.5), "hours"],
                ["Physical activity", String(30 + (i % 4) * 5), "minutes"],
                ["Hydration", String(5 + (i % 3)), "glasses"],
              ]
            : [
                [
                  "Blood pressure",
                  `${(p.id === "elder" ? 138 : 130) + [4, 8, 2, 6, 0, -2, 3][i % 7]}/${80 + (i % 4)}`,
                  "mmHg",
                ],
                [
                  "Blood glucose",
                  String((p.id === "elder" ? 128 : 103) + (i % 5) * 4),
                  "mg/dL",
                ],
                [
                  "Weight",
                  String((p.id === "elder" ? 72 : 64) + (i % 4) * 0.2),
                  "kg",
                ],
                ["Sleep", String(6 + (i % 4) * 0.5), "hours"],
                ["Physical activity", String(20 + (i % 4) * 5), "minutes"],
              ];
      for (const [title, value, unit] of measures)
        add(p.id, "observation", title, date, {
          value,
          unit,
          notes: "Synthetic observation for the presentation.",
          time: "08:30",
        });
    }
    add(p.id, "observation", "Symptom", "2026-11-19", {
      value:
        p.id === "child"
          ? "Loose stool, 2 episodes"
          : p.id === "teen"
            ? "Mild cramps"
            : "Mild fatigue",
      notes:
        "Recorded by the patient or caregiver. Discuss recurring observations at the next review.",
      severity: "Mild",
      time: "16:30",
    });
    add(p.id, "observation", "Hospital admission", "2026-10-12", {
      value: "Observation visit",
      notes: "Fictional visit for review. No treatment recommendations.",
    });
    add(p.id, "observation", "Discharge", "2026-10-14", {
      value: "Review completed",
      notes: "Bring records to the next scheduled consultation.",
    });
    add(p.id, "observation", "Laboratory result", "2026-11-14", {
      value: "Routine laboratory report available",
      notes: "Clinician interpretation pending.",
    });
    add(
      p.id,
      "event",
      p.id === "child"
        ? "Paediatric growth review"
        : "Health review with Dr. Meera",
      "2026-11-23",
      {
        type: "Doctor appointment",
        time: "10:30",
        end: "11:00",
        location: p.hospital,
        doctor: p.doctor,
        caregiver: "Kavya Sharma",
        notes: "Bring recent measurements and medication list.",
        reminder: "60",
        recurrence: "None",
        status: "Scheduled",
      },
    );
    add(p.id, "event", "Evening care check-in", TODAY, {
      type: "Caregiver visit",
      time: "18:00",
      end: "18:30",
      location: "Home",
      caregiver: "Kavya Sharma",
      recurrence: "Daily",
      reminder: "30",
      status: "Scheduled",
    });
    add(p.id, "caregiver", "Kavya Sharma", TODAY, {
      role: "Primary caregiver",
      permissions: "Observations and medicines",
      phone: "",
      notes:
        "Fictional contact. Add a test phone number to enable the dialler.",
      status: "Active",
    });
    add(p.id, "caregiver", "Arjun Sharma", TODAY, {
      role: "Secondary caregiver",
      permissions: "Care tasks only",
      phone: "",
      status: "Active",
    });
    add(p.id, "task", "Review today’s observations", TODAY, {
      status: "Pending",
      caregiver: "Kavya Sharma",
    });
    add(p.id, "task", "Prepare consultation questions", "2026-11-23", {
      status: "Pending",
      caregiver: "Arjun Sharma",
    });
    add(p.id, "notification", "Upcoming health review", "2026-11-20", {
      type: "Doctor appointment",
      status: "Unread",
      notes: "Your fictional appointment is on 23 November at 10:30.",
    });
    add(p.id, "notification", "Care check-in scheduled", "2026-11-20", {
      type: "Caregiver task",
      status: "Unread",
      notes: "Kavya is assigned to the evening check-in.",
    });
    add(p.id, "document", "Routine consultation summary", "2026-11-14", {
      type: "Consultation notes",
      doctor: p.doctor,
      notes: `Fictional consultation for ${p.name}. Conditions: ${p.conditions}. Bring recent observations to the next review.`,
      status: "Sample document",
    });
    if (p.id === "adult" || p.id === "elder") {
      add(p.id, "medication", "Amlodipine", TODAY, {
        strength: "5 mg",
        dosage: "1 tablet",
        frequency: "Once daily",
        time: "08:00",
        start: "2026-10-20",
        end: "2026-12-20",
        doctor: p.doctor,
        notes:
          "Fictional prescription only. Follow your own clinician’s instructions.",
        status: "Scheduled",
        duration: "60 days",
        refill: "2026-12-15",
      });
      if (p.id === "elder")
        add(p.id, "medication", "Metformin", TODAY, {
          strength: "500 mg",
          dosage: "1 tablet",
          frequency: "Twice daily",
          time: "08:00, 20:00",
          start: "2026-10-20",
          end: "2026-12-20",
          doctor: p.doctor,
          notes: "Fictional prescription only; not dosing advice.",
          status: "Scheduled",
          duration: "60 days",
          refill: "2026-12-15",
        });
    }
  }
  for (const [patient, title, value, date, extra] of [
    [
      "child",
      "Bowel movement",
      "2 loose stools",
      "2026-11-19",
      {
        quantity: "2",
        consistency: "Loose",
        colour: "Yellow",
        notes:
          "Fictional caregiver observation; review with paediatrician if persistent.",
      },
    ],
    [
      "child",
      "Vomiting",
      "1 episode after a feed",
      "2026-11-17",
      { quantity: "1", severity: "Mild" },
    ],
    [
      "child",
      "Urination / wet diapers",
      "6 wet diapers",
      "2026-11-20",
      { quantity: "6" },
    ],
    [
      "elder",
      "Vomiting",
      "1 episode",
      "2026-11-11",
      { quantity: "1", severity: "Mild" },
    ],
    [
      "elder",
      "Vomiting",
      "1 episode",
      "2026-11-18",
      {
        quantity: "1",
        severity: "Mild",
        notes: "Repeated observation to discuss at the next consultation.",
      },
    ],
    [
      "elder",
      "Bowel movement",
      "2 loose stools",
      "2026-11-18",
      { quantity: "2", consistency: "Loose" },
    ],
    [
      "elder",
      "Walking",
      "15 minutes with caregiver",
      "2026-11-20",
      { duration: "15 minutes" },
    ],
    ["elder", "Hydration", "6", "2026-11-20", { unit: "glasses" }],
    [
      "elder",
      "Mobility",
      "Walking with usual support",
      "2026-11-20",
      { notes: "Caregiver observation, not a functional assessment." },
    ],
    [
      "elder",
      "Clinical note",
      "Bring home measurements and medication list to follow-up.",
      "2026-11-14",
      { source: "Doctor-entered", notes: "Fictional clinician instruction." },
    ],
    [
      "teen",
      "Skin & acne",
      "Mild skin concerns noted",
      "2026-11-18",
      { notes: "Questions saved for the next review." },
    ],
  ] as [string, string, string, string, Record<string, string>][])
    add(patient, "observation", title, date, { value, ...extra });
  add("child", "observation", "Vaccination", "2026-10-20", {
    value: "Previous vaccine visit recorded",
    notes: "Verify the next vaccine and due date with the paediatrician.",
  });
  add("child", "observation", "Milestone", "2026-11-18", {
    value: "Sits with support",
    notes: "Caregiver observation; not a developmental assessment.",
  });
  add("child", "observation", "Height", TODAY, { value: "69", unit: "cm" });
  add("child", "observation", "Head circumference", TODAY, {
    value: "43",
    unit: "cm",
  });
  add("teen", "observation", "Menstrual cycle", "2026-11-05", {
    value: "Period start",
    end: "2026-11-09",
    flow: "Moderate",
    cycle: "29",
    notes: "Mild cramps",
    private: "true",
  });
  add("teen", "observation", "Private journal", TODAY, {
    value: "Feeling more rested after badminton.",
    private: "true",
    notes: "Visible in personal view only.",
  });
  return {
    patients: structuredClone(patients),
    entries,
    selected: "elder",
    settings: {
      language: "English",
      theme: "Light",
      large: false,
      private: true,
      notifications: true,
      number: "112",
      presentation: false,
    },
  };
}
export const storageKey = "medvita-frontend-demo-v1";
function resourceService(category: string) {
  return {
    category,
    list: (d: DemoData, patient: string) =>
      d.entries.filter((e) => e.category === category && e.patient === patient),
    save: (d: DemoData, e: Entry) => ({
      ...d,
      entries: d.entries.some((x) => x.id === e.id)
        ? d.entries.map((x) => (x.id === e.id ? { ...e, category } : x))
        : [{ ...e, category }, ...d.entries],
    }),
    remove: (d: DemoData, id: string) => ({
      ...d,
      entries: d.entries.filter(
        (e) => !(e.category === category && e.id === id),
      ),
    }),
  };
}
export const services = {
  patients: {
    update: (d: DemoData, p: Patient) => ({
      ...d,
      patients: d.patients.map((x) => (x.id === p.id ? p : x)),
    }),
  },
  symptoms: resourceService("observation"),
  medications: resourceService("medication"),
  calendar: resourceService("event"),
  documents: resourceService("document"),
  caregivers: resourceService("caregiver"),
  ai: resourceService("report"),
  wellness: resourceService("wellness"),
  notifications: resourceService("notification"),
  emergency: resourceService("emergency"),
  save: (d: DemoData, e: Entry) => ({
    ...d,
    entries: d.entries.some((x) => x.id === e.id)
      ? d.entries.map((x) => (x.id === e.id ? e : x))
      : [e, ...d.entries],
  }),
  remove: (d: DemoData, id: string) => ({
    ...d,
    entries: d.entries.filter((x) => x.id !== id),
  }),
};
export function reportFor(p: Patient, entries: Entry[], query: string) {
  const records = entries.filter((e) => e.patient === p.id && !isPrivate(e));
  const meds = records.filter((e) => e.category === "medication");
  const symptoms = records.filter(
    (e) =>
      e.category === "observation" &&
      [
        "Symptom",
        "Vomiting",
        "Bowel movement",
        "Falls",
        "Dizziness",
        "Breathlessness",
      ].includes(e.title),
  );
  const vitals = records
    .filter(
      (e) =>
        e.category === "observation" &&
        ["Blood pressure", "Blood glucose", "Weight", "Sleep"].includes(
          e.title,
        ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const hospitals = records.filter((e) =>
    ["Hospital admission", "Discharge"].includes(e.title),
  );
  let focus = `Recent observations: ${symptoms.map((e) => `${dateLabel(e.date)}: ${e.value}`).join("; ") || "No symptom observations recorded."}`;
  if (/medicine|medication|schedule/i.test(query))
    focus = `Medication organisation: ${meds.map((e) => `${e.title} ${e.strength}, recorded schedule ${e.time}; ${e.status}`).join("; ") || "No prescription recorded. Do not infer a medication plan."}`;
  else if (/document|laboratory|prescription summary/i.test(query))
    focus = `Document organisation (metadata and manually reviewed demo fields only): ${
      records
        .filter((e) => e.category === "document")
        .map(
          (e) =>
            `${e.title} — ${e.type}, ${e.date}, ${e.doctor || "doctor not recorded"}. ${e.extracted || e.notes || "No reviewed fields saved"}`,
        )
        .join("; ") || "No document records available."
    }. Uploaded files are not read by a real OCR or language model.`;
  else if (/caregiver|handover/i.test(query))
    focus = `Care coordination: ${records
      .filter((e) => e.category === "caregiver")
      .map((e) => `${e.title} (${e.role}; ${e.permissions})`)
      .join("; ")}. Tasks: ${
      records
        .filter((e) => e.category === "task")
        .map((e) => `${e.title}: ${e.status} — ${e.caregiver}`)
        .join("; ") || "No care tasks recorded"
    }.`;
  else if (/missing/i.test(query))
    focus =
      "Missing information: verified allergy history, independently verified prescription details, and clinician interpretation of recent measurements.";
  else if (/hospital|visit/i.test(query))
    focus = `Hospital history: ${hospitals.map((e) => `${dateLabel(e.date)} ${e.title}: ${e.value}`).join("; ")}`;
  else if (/compare|trend/i.test(query))
    focus = `Historical comparison: ${[
      "Blood pressure",
      "Blood glucose",
      "Weight",
      "Sleep",
    ]
      .map((kind) => {
        const rows = vitals.filter((e) => e.title === kind);
        return rows.length
          ? `${kind}: ${rows.at(-1)?.value} → ${rows[0].value} ${rows[0].unit || ""} across ${rows.length} observations`
          : "";
      })
      .filter(Boolean)
      .join(
        "; ",
      )}. Symptom observations recorded: ${symptoms.length}; ${symptoms.filter((e) => inRange(e, 7)).length} in the last 7 days and ${symptoms.filter((e) => !inRange(e, 7)).length} earlier. Records: ${symptoms.map((e) => `${e.date}: ${e.title} — ${e.value}`).join("; ")}.`;
  const patternNote =
    p.id === "child"
      ? `Paediatric demonstration rule: ${symptoms.length} symptom entries recorded. ${symptoms.length >= 2 ? "Repeated observations are flagged for paediatric review by this synthetic rule." : "Continue recording observations for the paediatrician."} This is not a clinical threshold. Repeated vomiting, poor feeding or concerns about hydration merit professional assessment; severe or rapidly worsening symptoms need urgent help.`
      : "";
  return `DEMONSTRATION AI OUTPUT\n${p.name} · ${p.age} · ${query}\n\nRecorded context\n${p.conditions}. Reported allergies: ${p.allergies}.\n\n${focus}\n\n${patternNote}\n\nConsultation preparation\nReview recurring observations, discuss measurement technique, and verify the prescription list with ${p.doctor}. ${meds.length} prescription records; ${symptoms.length} symptom observations.\n\nHistorical events\n${hospitals.map((e) => `${e.date}: ${e.title} — ${e.value}`).join("\n")}\n\nData used\n${records.length} non-private local demo records. Latest sources: ${[
    ...symptoms,
    ...vitals.slice(0, 3),
    ...meds,
    ...records.filter((e) => e.category === "document"),
  ]
    .slice(0, 8)
    .map((e) => `${e.title} (${e.date}, ${e.source}, ID ${e.id.slice(0, 8)})`)
    .join(
      "; ",
    )}.\n\nMissing information\nVerified allergy history and clinician interpretation. No diagnosis or medication changes are generated. This is deterministic demonstration logic, not a clinically validated model.\n\nNext step\nBring this report to a qualified clinician. For severe or rapidly worsening symptoms, seek urgent medical assessment; do not wait for a demo report.`;
}
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function calendarExport(entries: Entry[]) {
  const esc = (v: string) =>
    v
      .replace(/\r/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/[,;]/g, "\\$&");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MEDVITA//Demo//EN",
    ...entries.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}@medvita`,
      `DTSTAMP:20261120T000000Z`,
      `DTSTART;TZID=Asia/Kolkata:${e.date.replaceAll("-", "")}T${(e.time || "09:00").replace(":", "")}00`,
      `DTEND;TZID=Asia/Kolkata:${e.date.replaceAll("-", "")}T${(e.end || "10:00").replace(":", "")}00`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.notes || "")}`,
      `LOCATION:${esc(e.location || "")}`,
      `STATUS:${e.status === "Cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      ...(Number(e.reminder) > 0
        ? [
            "BEGIN:VALARM",
            `TRIGGER:-PT${Number(e.reminder)}M`,
            "ACTION:DISPLAY",
            `DESCRIPTION:${esc(e.title)}`,
            "END:VALARM",
          ]
        : []),
      ...(e.recurrence && e.recurrence !== "None"
        ? [`RRULE:FREQ=${e.recurrence.toUpperCase()}`]
        : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");
}
