"use client";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Plus, Trash2, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  type Entry,
  type Patient,
  observationTypes,
  eventTypes,
  TODAY,
  dateLabel,
  uid,
} from "@/lib/demo/data";
import {
  measurementRows,
  numericValue,
  sensitiveTitles,
} from "@/lib/demo/selectors";
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {title && <h2>{title}</h2>}
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}
export function Chart({
  entries,
  kind,
  days = 14,
}: {
  entries: Entry[];
  kind: string;
  days?: number;
}) {
  let rows = measurementRows(entries, kind, days);
  if (kind === "Menstrual cycle duration")
    rows = entries
      .filter(
        (e) =>
          e.title === "Menstrual cycle" &&
          e.cycle &&
          Number.isFinite(Number(e.cycle)),
      )
      .map((e) => ({ ...e, title: kind, value: e.cycle, unit: "days" }));
  if (
    ["Symptom frequency", "Medication adherence", "Wellness progress"].includes(
      kind,
    )
  ) {
    const source = entries.filter((e) =>
      kind === "Symptom frequency"
        ? e.category === "observation" &&
          [
            "Symptom",
            "Vomiting",
            "Bowel movement",
            "Falls",
            "Pain",
            "Dizziness",
            "Breathlessness",
          ].includes(e.title)
        : kind === "Medication adherence"
          ? e.category === "administration" && e.status === "Taken"
          : e.category === "wellness" && e.status === "Completed",
    );
    rows = [...new Set(source.map((e) => e.date))].sort().map((date) => ({
      id: `${kind}-${date}`,
      patient: source[0]?.patient || "",
      category: "observation",
      title: kind,
      date,
      value: String(source.filter((e) => e.date === date).length),
      unit: "recorded entries",
      status: "Recorded",
      source: "Derived from local demo records",
    }));
  }
  rows = measurementRows(rows, kind, days);

  const points = rows.map((e) => numericValue(e)!);
  if (!points.length)
    return (
      <Empty
        text={`No ${kind.toLowerCase()} data in this date range. Record the associated measurement or activity to start a trend.`}
      />
    );
  const min = Math.min(...points) * 0.93,
    max = Math.max(...points) * 1.04;
  const coords = points.map(
    (v, i) =>
      `${45 + (i * 550) / Math.max(points.length - 1, 1)},${160 - ((v - min) / (max - min || 1)) * 125}`,
  );
  return (
    <div className="chart">
      {kind === "Menstrual cycle duration" && (
        <small>Private personal history · excluded from shared reports</small>
      )}
      {kind === "Blood pressure" && (
        <small>Systolic trend · full readings in measurement data</small>
      )}
      <svg
        viewBox="0 0 640 205"
        role="img"
        aria-label={`${kind} trend: ${rows.map((e) => `${e.date}: ${e.value}`).join(", ")}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="45"
              y1={35 + i * 42}
              x2="610"
              y2={35 + i * 42}
              stroke="var(--line)"
              strokeDasharray="4 5"
            />
            <text x="3" y={39 + i * 42}>
              {(max - ((max - min) * i) / 3).toFixed(kind === "Weight" ? 1 : 0)}
            </text>
          </g>
        ))}
        <polygon
          points={`45,165 ${coords.join(" ")} ${coords.at(-1)?.split(",")[0]},165`}
          fill="var(--teal)"
          opacity=".07"
        />
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke="var(--teal)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.split(",")[0]}
            cy={c.split(",")[1]}
            r="4"
            fill="var(--surface)"
            stroke="var(--teal)"
            strokeWidth="2"
          >
            <title>
              {rows[i].date}: {rows[i].value} {rows[i].unit}
            </title>
          </circle>
        ))}
        {rows
          .filter((_, i) => i % Math.max(1, Math.ceil(rows.length / 6)) === 0)
          .map((e) => (
            <text
              key={e.id}
              x={45 + (rows.indexOf(e) * 550) / Math.max(rows.length - 1, 1)}
              y="193"
              textAnchor="middle"
            >
              {dateLabel(e.date)}
            </text>
          ))}
      </svg>
      <details>
        <summary>View measurement data</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>{kind}</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>{dateLabel(e.date)}</td>
                  <td>
                    {e.value} {e.unit}
                  </td>
                  <td>{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
export function EntryList({
  entries,
  edit,
  remove,
  limit = 50,
}: {
  entries: Entry[];
  edit?: (e: Entry) => void;
  remove?: (e: Entry) => void;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="entry-list">
      {entries.slice(0, expanded ? undefined : limit).map((e) => (
        <div className="entry-row" key={e.id}>
          <span className="timeline-dot" />
          <div className="grow">
            <strong>{e.title}</strong>
            <p>
              {e.category === "caregiver"
                ? `${e.role} · ${e.permissions}`
                : e.value || e.notes || e.type || e.role}{" "}
              {e.unit}
            </p>
            <small>
              {dateLabel(e.date)} {e.time} · {e.source}
              {e.private === "true" ? " · Private" : ""}
            </small>
          </div>
          <Badge tone={e.status === "Missed" ? "red" : "grey"}>
            {e.status}
          </Badge>
          {edit && (
            <button
              className="icon-button"
              aria-label={`Edit ${e.title}`}
              onClick={() => edit(e)}
            >
              <Pencil size={15} />
            </button>
          )}
          {remove && (
            <button
              className="icon-button"
              aria-label={`Delete ${e.title}`}
              onClick={() => remove(e)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      {entries.length > limit && (
        <button className="text-button" onClick={() => setExpanded(!expanded)}>
          {expanded
            ? "Show fewer records"
            : `Show all ${entries.length} records`}
        </button>
      )}
      {!entries.length && (
        <Empty text="No matching entries. Add a record to start this timeline." />
      )}
    </div>
  );
}
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  min?: string;
  max?: string;
};
const common: Field[] = [
  { name: "date", label: "Date", type: "date", required: true },
  {
    name: "source",
    label: "Record source",
    options: [
      "Demonstration data",
      "Patient-entered",
      "Caregiver-entered",
      "Doctor-entered",
      "Uploaded document",
    ],
  },
  { name: "notes", label: "Notes", type: "textarea" },
];
export function fieldsFor(category: string): Field[] {
  if (category === "medication")
    return [
      { name: "title", label: "Medicine name", required: true },
      { name: "strength", label: "Strength", required: true },
      { name: "dosage", label: "Dosage as prescribed", required: true },
      {
        name: "frequency",
        label: "Frequency",
        options: [
          "Once daily",
          "Twice daily",
          "Three times daily",
          "As prescribed",
        ],
      },
      {
        name: "time",
        label: "Times (HH:MM, separated by commas)",
        required: true,
      },
      { name: "duration", label: "Duration" },
      {
        name: "status",
        label: "Prescription status",
        options: ["Scheduled", "Discontinued"],
      },
      { name: "start", label: "Start date", type: "date", required: true },
      { name: "end", label: "End date", type: "date" },
      { name: "refill", label: "Refill reminder", type: "date" },
      { name: "doctor", label: "Prescribing doctor", required: true },
      ...common,
    ];
  if (category === "event")
    return [
      { name: "title", label: "Event title", required: true },
      { name: "type", label: "Event type", options: eventTypes },
      { name: "time", label: "Start time", type: "time", required: true },
      { name: "end", label: "End time", type: "time", required: true },
      { name: "doctor", label: "Doctor" },
      { name: "caregiver", label: "Assigned caregiver" },
      { name: "location", label: "Location" },
      {
        name: "reminder",
        label: "Reminder (minutes before)",
        type: "number",
        min: "0",
        max: "43200",
      },
      {
        name: "recurrence",
        label: "Recurrence",
        options: ["None", "Daily", "Weekly", "Monthly"],
      },
      { name: "attachment", label: "Document reference / filename" },
      {
        name: "status",
        label: "Status",
        options: ["Scheduled", "Completed", "Missed", "Cancelled"],
      },
      ...common,
    ];
  if (category === "caregiver")
    return [
      { name: "title", label: "Caregiver name", required: true },
      {
        name: "role",
        label: "Role",
        options: [
          "Primary caregiver",
          "Secondary caregiver",
          "Family member",
          "Nurse",
        ],
      },
      { name: "phone", label: "Phone number (optional)", type: "tel" },
      {
        name: "permissions",
        label: "Simulated permission scope",
        options: [
          "Observations and medicines",
          "Care tasks only",
          "Read shared records",
        ],
      },
      ...common,
    ];
  if (category === "task")
    return [
      { name: "title", label: "Care task", required: true },
      { name: "caregiver", label: "Assigned caregiver", required: true },
      {
        name: "status",
        label: "Status",
        options: ["Pending", "Completed", "Missed"],
      },
      ...common,
    ];
  if (category === "document")
    return [
      { name: "title", label: "Document title", required: true },
      {
        name: "type",
        label: "Category",
        options: [
          "Prescription",
          "Laboratory report",
          "Imaging report",
          "Discharge summary",
          "Vaccination certificate",
          "Consultation notes",
          "Medical history",
        ],
      },
      { name: "doctor", label: "Doctor" },
      ...common,
    ];
  return [
    { name: "title", label: "Observation type", options: observationTypes },
    { name: "value", label: "Value or observation", required: true },
    { name: "unit", label: "Unit (where applicable)" },
    { name: "time", label: "Time", type: "time" },
    {
      name: "severity",
      label: "Severity",
      options: ["Not applicable", "Mild", "Moderate", "Severe"],
    },
    {
      name: "quantity",
      label: "Quantity / number of episodes",
      type: "number",
      min: "0",
    },
    { name: "duration", label: "Duration / frequency" },
    {
      name: "feeding",
      label: "Feeding method",
      options: [
        "Not applicable",
        "Breastfeeding",
        "Formula",
        "Mixed",
        "Complementary food",
      ],
    },
    { name: "consistency", label: "Stool consistency / flow" },
    { name: "colour", label: "Colour / associated observations" },
    { name: "end", label: "End date (cycle or event)", type: "date" },
    {
      name: "cycle",
      label: "Cycle duration (days)",
      type: "number",
      min: "1",
      max: "180",
    },
    {
      name: "flow",
      label: "Menstrual flow",
      options: ["Not applicable", "Light", "Moderate", "Heavy"],
    },
    ...common,
  ];
}
export function EditForm({
  entry,
  patient,
  patients,
  documents,
  onSave,
  onClose,
}: {
  entry: Partial<Entry>;
  patient: Patient;
  patients: Patient[];
  documents: Entry[];
  onSave: (e: Entry) => void;
  onClose: () => void;
}) {
  const category = entry.category || "observation";
  const fields = fieldsFor(category);
  const [draft, setDraft] = useState<Record<string, string>>(
    () =>
      ({
        ...Object.fromEntries(
          fields.map((f) => [f.name, f.options?.[0] || ""]),
        ),
        date: TODAY,
        time: category === "medication" ? "08:00" : "09:00",
        end: category === "event" ? "10:00" : "",
        start: TODAY,
        patient: patient.id,
        status:
          category === "event" || category === "medication"
            ? "Scheduled"
            : category === "task"
              ? "Pending"
              : category === "caregiver"
                ? "Active"
                : "Recorded",
        ...entry,
        attachment: entry.attachment
          ? documents.find(
              (d) => d.id === entry.attachment || d.title === entry.attachment,
            )?.id || "None"
          : "None",
      }) as Record<string, string>,
  );
  const [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title={`${entry.id ? "Edit" : "Add"} ${category}`}
    >
      <p className="muted">
        Fictional demonstration records only. Changes stay in this browser.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !draft.title.trim() ||
            fields.some((f) => f.required && !draft[f.name]?.trim())
          ) {
            setError("Complete all required fields with a value.");
            return;
          }
          if (
            draft.title === "Menstrual cycle" &&
            draft.end &&
            draft.end < draft.date
          ) {
            setError("Cycle end date must be on or after the start date.");
            return;
          }
          if (
            category === "caregiver" &&
            draft.phone &&
            !/^\+?[\d\s()-]{6,20}$/.test(draft.phone)
          ) {
            setError(
              "Enter a valid phone number using digits, spaces, +, parentheses or hyphens.",
            );
            return;
          }
          if (category === "event" && draft.end <= draft.time) {
            setError("End time must be after start time.");
            return;
          }
          if (
            category === "medication" &&
            !/^([01]\d|2[0-3]):[0-5]\d(,\s*([01]\d|2[0-3]):[0-5]\d)*$/.test(
              draft.time,
            )
          ) {
            setError("Use 24-hour times, for example 08:00, 20:00.");
            return;
          }
          if (
            category === "medication" &&
            draft.end &&
            draft.end < draft.start
          ) {
            setError("End date must be on or after the start date.");
            return;
          }
          if (
            category === "medication" &&
            new Set(draft.time.split(",").map((t) => t.trim())).size !==
              draft.time.split(",").length
          ) {
            setError("Each dose time must be unique.");
            return;
          }
          if (
            category === "observation" &&
            draft.title === "Blood pressure" &&
            !/^\d{2,3}\/\d{2,3}$/.test(draft.value)
          ) {
            setError(
              "Enter blood pressure as systolic/diastolic, for example 128/80.",
            );
            return;
          }
          if (
            [
              "Blood glucose",
              "Weight",
              "Height",
              "Head circumference",
              "Sleep",
              "Temperature",
            ].includes(draft.title) &&
            (!Number.isFinite(Number(draft.value)) || Number(draft.value) <= 0)
          ) {
            setError("Enter a positive numeric measurement.");
            return;
          }
          onSave({
            ...draft,
            id: entry.id || uid(),
            category,
            patient: draft.patient,
            title: draft.title.trim(),
            date: draft.date,
            status: draft.status,
            source: draft.source,
            private:
              ["Private journal", "Menstrual cycle"].includes(draft.title) ||
              (["teen", "teen-boy"].includes(draft.patient) && sensitiveTitles.has(draft.title))
                ? "true"
                : draft.private || "false",
          });
        }}
      >
        <div className="form-grid">
          <label>
            Patient
            <select
              value={draft.patient}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  patient: e.target.value,
                  attachment: "None",
                })
              }
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {fields
            .map((f) =>
              f.name === "attachment"
                ? {
                    ...f,
                    label: "Attach a document from Medical Records",
                    options: [
                      "None",
                      ...documents
                        .filter((d) => d.patient === draft.patient)
                        .map((d) => d.id),
                    ],
                  }
                : f,
            )
            .filter(
              (f) =>
                category !== "observation" ||
                ![
                  "quantity",
                  "duration",
                  "feeding",
                  "consistency",
                  "colour",
                  "end",
                  "cycle",
                  "flow",
                ].includes(f.name) ||
                (
                  {
                    quantity: [
                      "Feeding",
                      "Vomiting",
                      "Bowel movement",
                      "Urination / wet diapers",
                      "Falls",
                    ],
                    duration: [
                      "Feeding",
                      "Vomiting",
                      "Bowel movement",
                      "Sleep",
                      "Physical activity",
                      "Walking",
                    ],
                    feeding: ["Feeding"],
                    consistency: ["Bowel movement"],
                    colour: ["Bowel movement", "Vomiting"],
                    end: ["Menstrual cycle", "Hospital admission"],
                    cycle: ["Menstrual cycle"],
                    flow: ["Menstrual cycle"],
                  } as Record<string, string[]>
                )[f.name]?.includes(draft.title),
            )
            .map((f) => (
              <label
                key={f.name}
                className={f.type === "textarea" ? "span2" : ""}
              >
                {f.label}
                {f.required ? " *" : ""}
                {f.options ? (
                  <select
                    aria-label={f.label}
                    value={draft[f.name]}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.name]: e.target.value })
                    }
                  >
                    {f.options.map((v) => (
                      <option key={v} value={v}>
                        {f.name === "attachment"
                          ? documents.find((d) => d.id === v)?.title || v
                          : v}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={draft[f.name]}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.name]: e.target.value })
                    }
                    maxLength={2000}
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    required={f.required}
                    min={f.min}
                    max={f.max}
                    maxLength={300}
                    value={draft[f.name]}
                    onChange={(e) =>
                      setDraft({ ...draft, [f.name]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            <Check size={16} />
            Save record
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function AddButton({
  onClick,
  label = "Add record",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="primary" onClick={onClick}>
      <Plus size={17} />
      {label}
    </button>
  );
}
export function MoreButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}
