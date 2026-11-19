import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAppointment, createBowelMovementRecord, createFeedingRecord, createGrowthRecord, createHealthEvent, createMedication, createMenstrualRecord, createSleepRecord, createSymptomObservation, createUrinationRecord, createVitalRecord, createVomitingRecord, updateAppointmentStatus, updateMedicationStatus, uploadPatientDocument } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  storage: { from: vi.fn() },
};

function query(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function updateQuery(result: unknown) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function eventForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ eventType: "care_note", title: "Fictional sample", description: "Synthetic note", occurredAt: "", visibility: "general", ...values })) form.set(key, value);
  return form;
}

function symptomForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ symptom: "Fictional sample observation", severity: "2", notes: "Fictional note", visibility: "general", ...values })) form.set(key, value);
  return form;
}

function feedingForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ feedingType: "formula", quantityMl: "120", durationMinutes: "15", notes: "Fictional observation", ...values })) form.set(key, value);
  return form;
}

function bowelForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ consistency: "Fictional sample", color: "Fictional sample", notes: "Fictional observation", ...values })) form.set(key, value);
  return form;
}

function vomitingForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ count: "2", associatedNotes: "Fictional observation", ...values })) form.set(key, value);
  return form;
}

function growthForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ weightKg: "8.25", heightCm: "72", headCircumferenceCm: "44.5", ...values })) form.set(key, value);
  return form;
}

function vitalForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ vitalType: "blood_pressure_systolic", value: "122", ...values })) form.set(key, value);
  return form;
}

function menstrualForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ periodStart: "2026-11-03", periodEnd: "2026-11-07", flowNote: "Fictional sample note", symptomNote: "Fictional sample note", ...values })) form.set(key, value);
  return form;
}

function urinationForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ urinationType: "wet_diaper", count: "3", volumeMl: "120", notes: "Fictional observation", ...values })) form.set(key, value);
  return form;
}

function sleepForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ sleepType: "overnight", startedAt: "2026-11-20T08:00", startedAtOffset: "-330", endedAt: "2026-11-20T09:00", endedAtOffset: "-330", notes: "Fictional observation", ...values })) form.set(key, value);
  return form;
}

function appointmentForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: "Fictional clinic visit", startsAt: "2026-11-21T09:00", startsAtOffset: "-330", endsAt: "", endsAtOffset: "0", location: "Demo clinic", ...values })) form.set(key, value);
  return form;
}

function medicationForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ medicineName: "Fictional sample medicine", genericName: "", strength: "As recorded", route: "By mouth", instructions: "Fictional directions", status: "active", visibility: "general", ...values })) form.set(key, value);
  return form;
}

function medicationStatusForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ medicationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", status: "historical", ...values })) form.set(key, value);
  return form;
}

function appointmentStatusForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ appointmentId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", status: "cancelled", ...values })) form.set(key, value);
  return form;
}

function documentForm(file: File, values: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", file);
  for (const [key, value] of Object.entries({ displayName: "Fictional sample report", documentType: "test_result", documentDate: "2026-11-20", visibility: "general", ...values })) form.set(key, value);
  return form;
}

describe("health event server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const profileQuery = query({ data: { id: patientId, life_stage: "adult" }, error: null });
    const relationshipQuery = query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "patient_profiles") return profileQuery;
      if (table === "patient_relationships") return relationshipQuery;
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("requires an authenticated account", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("signed out") });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/sign in/i);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("requires an active writable relationship before inserting", async () => {
    const readOnlyRelationship = query({ data: { status: "active", can_read: true, can_write: false }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? readOnlyRelationship : { insert: vi.fn() });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("health_events");
  });

  it("creates an unverified patient entry through the row-level protected table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm());

    expect(result).toEqual({ status: "success", message: "Note saved as an unverified entry." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: patientId,
      title: "Fictional sample",
      source: "patient",
      verification_status: "unverified",
      created_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("allows sensitive visibility only for an adolescent profile", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn() });

    const result = await createHealthEvent(patientId, { status: "idle", message: "" }, eventForm({ visibility: "sensitive_adolescent" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/adolescent profile/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("health_events");
  });
});

describe("symptom observation server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("requires active write access before saving a symptom observation", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : query({ data: { status: "pending", can_read: false, can_write: false }, error: null }));
    const result = await createSymptomObservation(patientId, { status: "idle", message: "" }, symptomForm());
    expect(result.status).toBe("error");
    expect(mockSupabase.from).not.toHaveBeenCalledWith("symptom_observations");
  });

  it("stores an unverified severity observation for the authorized patient", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
        : { insert });
    const result = await createSymptomObservation(patientId, { status: "idle", message: "" }, symptomForm());
    expect(result).toEqual({ status: "success", message: "Self-reported observation saved as unverified." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, symptom: "Fictional sample observation", severity: 2, created_by: "user-1" }));
  });
});

describe("child care log server actions", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "infant" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves a feeding entry only for an infant or child profile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "infant" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createFeedingRecord(patientId, { status: "idle", message: "" }, feedingForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, feeding_type: "formula", quantity_ml: 120, duration_minutes: 15, created_by: "user-1" }));
  });

  it("saves a bowel movement entry under the same access and life-stage checks", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createBowelMovementRecord(patientId, { status: "idle", message: "" }, bowelForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, consistency: "Fictional sample", color: "Fictional sample", created_by: "user-1" }));
  });

  it("does not allow child care logs on an adult profile", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert: vi.fn() });
    const result = await createFeedingRecord(patientId, { status: "idle", message: "" }, feedingForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/infant or child/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("feeding_records");
  });

  it("saves a vomiting episode count and associated note for a child profile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createVomitingRecord(patientId, { status: "idle", message: "" }, vomitingForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, count: 2, associated_notes: "Fictional observation", created_by: "user-1" }));
  });

  it("saves at least one growth measurement for a child profile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createGrowthRecord(patientId, { status: "idle", message: "" }, growthForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, weight_kg: 8.25, height_cm: 72, head_circumference_cm: 44.5, created_by: "user-1" }));
  });

  it("requires at least one growth measurement", async () => {
    const result = await createGrowthRecord(patientId, { status: "idle", message: "" }, growthForm({ weightKg: "", heightCm: "", headCircumferenceCm: "" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/at least one measurement/i);
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});

describe("adult and senior vital server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("stores a unit-bound self-reported reading as unverified", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "senior" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createVitalRecord(patientId, { status: "idle", message: "" }, vitalForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, vital_type: "blood_pressure_systolic", value: 122, unit: "mmHg", source: "patient", verification_status: "unverified", created_by: "user-1" }));
  });

  it("allows a caregiver to record temperature for an infant or child", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "infant" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createVitalRecord(patientId, { status: "idle", message: "" }, vitalForm({ vitalType: "temperature", value: "38.2" }));
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, vital_type: "temperature", value: 38.2, unit: "°C", source: "caregiver", verification_status: "unverified", created_by: "user-1" }));
  });

  it("does not allow non-temperature vitals for a child profile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createVitalRecord(patientId, { status: "idle", message: "" }, vitalForm({ vitalType: "blood_pressure_systolic" }));
    expect(result.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("private adolescent cycle journal action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adolescent" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("stores an adolescent's own cycle note with sensitive visibility", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adolescent" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createMenstrualRecord(patientId, { status: "idle", message: "" }, menstrualForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, period_start: "2026-11-03", period_end: "2026-11-07", visibility: "sensitive_adolescent", created_by: "user-1" }));
  });

  it("does not allow a caregiver account to write a private cycle note", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adolescent" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert: vi.fn() });
    const result = await createMenstrualRecord(patientId, { status: "idle", message: "" }, menstrualForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/only the adolescent account/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("menstrual_records");
  });

  it("rejects a cycle end date before the start date", async () => {
    const result = await createMenstrualRecord(patientId, { status: "idle", message: "" }, menstrualForm({ periodStart: "2026-11-09", periodEnd: "2026-11-02" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/on or after the start date/i);
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});

describe("child urination and sleep server actions", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "infant" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves wet-diaper count and optional volume with caregiver provenance", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "infant" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createUrinationRecord(patientId, { status: "idle", message: "" }, urinationForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, urination_type: "wet_diaper", count: 3, volume_ml: 120, source: "caregiver", verification_status: "unverified", created_by: "user-1" }));
  });

  it("stores sleep periods as UTC instants after applying the local offset", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createSleepRecord(patientId, { status: "idle", message: "" }, sleepForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, sleep_type: "overnight", started_at: "2026-11-20T02:30:00.000Z", ended_at: "2026-11-20T03:30:00.000Z", source: "caregiver", created_by: "user-1" }));
  });

  it("rejects sleep periods whose end is before the start", async () => {
    const result = await createSleepRecord(patientId, { status: "idle", message: "" }, sleepForm({ endedAt: "2026-11-20T07:30" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/end time must be after/i);
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});

describe("appointment server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
      : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("rejects an end time that does not follow the start time", async () => {
    const result = await createAppointment(patientId, { status: "idle", message: "" }, appointmentForm({ endsAt: "2026-11-21T08:59", endsAtOffset: "-330" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/after the start time/i);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an active writable relationship", async () => {
    mockSupabase.from.mockImplementation(() => query({ data: { relationship_role: "caregiver", status: "pending", can_read: false, can_write: false }, error: null }));

    const result = await createAppointment(patientId, { status: "idle", message: "" }, appointmentForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("appointments");
  });

  it("saves an appointment with its account role and browser-timezone offset", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null })
      : { insert });

    const result = await createAppointment(patientId, { status: "idle", message: "" }, appointmentForm());

    expect(result).toEqual({ status: "success", message: "Appointment saved." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: patientId,
      title: "Fictional clinic visit",
      starts_at: "2026-11-21T03:30:00.000Z",
      source: "caregiver",
      status: "scheduled",
      created_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });
});

describe("medication server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves a self-reported medicine note through the protected table", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert });

    const result = await createMedication(patientId, { status: "idle", message: "" }, medicationForm());

    expect(result).toEqual({ status: "success", message: "Medicine note saved as unverified." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: patientId,
      medicine_name: "Fictional sample medicine",
      status: "active",
      visibility: "general",
      created_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("rejects sensitive medicine notes outside an adolescent profile", async () => {
    const insert = vi.fn();
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null })
        : { insert });

    const result = await createMedication(patientId, { status: "idle", message: "" }, medicationForm({ visibility: "sensitive_adolescent" }));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/adolescent profile/i);
    expect(insert).not.toHaveBeenCalled();
  });

  it("requires active write access before medication entry", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : query({ data: { status: "pending", can_read: false, can_write: false }, error: null }));

    const result = await createMedication(patientId, { status: "idle", message: "" }, medicationForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("medication_records");
  });
});

describe("medication status server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : updateQuery({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, error: null }));
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("updates only the chosen medicine note for the authorized profile", async () => {
    const update = updateQuery({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : update);

    const result = await updateMedicationStatus(patientId, { status: "idle", message: "" }, medicationStatusForm());

    expect(result).toEqual({ status: "success", message: "Medicine note marked as past or stopped." });
    expect(update.update).toHaveBeenCalledWith({ status: "historical" });
    expect(update.eq).toHaveBeenCalledWith("id", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    expect(update.eq).toHaveBeenCalledWith("patient_id", patientId);
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("does not update a medicine note without active write access", async () => {
    const update = updateQuery({ data: null, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: false }, error: null }) : update);

    const result = await updateMedicationStatus(patientId, { status: "idle", message: "" }, medicationStatusForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("medication_records");
  });
});

describe("appointment status server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : updateQuery({ data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null }));
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("marks only the chosen plan canceled for an authorized profile", async () => {
    const update = updateQuery({ data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : update);

    const result = await updateAppointmentStatus(patientId, { status: "idle", message: "" }, appointmentStatusForm());

    expect(result).toEqual({ status: "success", message: "Plan marked canceled in this profile." });
    expect(update.update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(update.eq).toHaveBeenCalledWith("id", "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
    expect(update.eq).toHaveBeenCalledWith("patient_id", patientId);
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("does not change appointment status without active write access", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: false }, error: null })
      : updateQuery({ data: null, error: null }));

    const result = await updateAppointmentStatus(patientId, { status: "idle", message: "" }, appointmentStatusForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("appointments");
  });
});

describe("patient document upload server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("rejects a file whose contents do not match its declared type", async () => {
    const file = new File(["not a real pdf"], "fictional.pdf", { type: "application/pdf" });

    const result = await uploadPatientDocument(patientId, { status: "idle", message: "" }, documentForm(file));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/does not match/i);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("uploads a signature-checked fictional PDF to the private path and saves unverified metadata", async () => {
    const file = new File(["%PDF-1.4 fictional sample"], "do-not-store-this-name.pdf", { type: "application/pdf" });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const storage = { upload, remove: vi.fn() };
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.storage.from.mockReturnValue(storage);
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
        : { insert });

    const result = await uploadPatientDocument(patientId, { status: "idle", message: "" }, documentForm(file));

    expect(result).toEqual({ status: "success", message: "Document uploaded as an unverified file." });
    const storagePath = upload.mock.calls[0][0] as string;
    expect(storagePath).toMatch(new RegExp(`^${patientId}/general/[0-9a-f-]+\\.pdf$`));
    expect(storagePath).not.toContain(file.name);
    expect(upload).toHaveBeenCalledWith(storagePath, file, { contentType: "application/pdf", upsert: false });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: patientId,
      storage_path: storagePath,
      display_name: "Fictional sample report",
      verification_status: "unverified",
      upload_status: "uploaded",
      uploaded_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("requires active write access before uploading files", async () => {
    const file = new File(["%PDF-1.4 fictional sample"], "fictional.pdf", { type: "application/pdf" });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : query({ data: { status: "pending", can_read: false, can_write: false }, error: null }));

    const result = await uploadPatientDocument(patientId, { status: "idle", message: "" }, documentForm(file));

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
  });
});
