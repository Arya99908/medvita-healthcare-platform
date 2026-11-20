import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAppointment, createBowelMovementRecord, createCalendarAppointment, createCaregiverHandover, createCaregiverTask, createDevelopmentalMilestone, createEmergencyContact, createFeedingRecord, createGrowthRecord, createHealthEvent, createMedicalCondition, createMedication, createMedicationSchedule, createMenstrualRecord, createSleepRecord, createSymptomObservation, createUrinationRecord, createVaccinationRecord, createVitalRecord, createVomitingRecord, deleteAppointment, deleteEmergencyContact, deleteHealthEvent, deleteMedicationNote, logMedicationAdministration, recordEmergencyAlert, updateAppointment, updateAppointmentStatus, updateCaregiverTaskStatus, updateHealthEvent, updateMedicationDetails, updateMedicationStatus, uploadPatientDocument } from "./actions";

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
    in: vi.fn(() => chain),
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

function deleteQuery(result: unknown) {
  const chain = { delete: vi.fn(() => chain), eq: vi.fn(() => chain), in: vi.fn(() => chain), select: vi.fn(() => chain), maybeSingle: vi.fn().mockResolvedValue(result) };
  return chain;
}

function listQuery(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
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

function conditionForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Hypertension", status: "active", diagnosedOn: "2020-01-02", notes: "Fictional sample", ...values })) form.set(key, value);
  return form;
}

function careTaskForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ assignedTo: "", title: "Prepare for appointment", dueAt: "2026-11-20T09:00", dueAtOffset: "-330", notes: "Fictional reminder", ...values })) form.set(key, value);
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

function vaccinationForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ vaccineName: "Fictional sample vaccine", doseLabel: "Dose 1", status: "planned", dueOn: "2026-12-15", administeredOn: "", documentId: "", notes: "Fictional reminder", ...values })) form.set(key, value);
  return form;
}

function milestoneForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ milestoneName: "Fictional sample observation", domain: "motor", status: "observed", recordedOn: "2026-11-20", followUpOn: "", notes: "Caregiver-entered fictional note", ...values })) form.set(key, value);
  return form;
}

function appointmentForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ patientId, eventType: "doctor_appointment", title: "Fictional clinic visit", startsAt: "2026-11-21T09:00", startsAtOffset: "-330", endsAt: "", endsAtOffset: "0", location: "Demo clinic", notes: "", ...values })) form.set(key, value);
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

function medicationScheduleForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ medicationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", frequency: "Twice daily as recorded", administrationTimes: "08:00, 20:00", startsOn: "2026-11-20", endsOn: "2026-11-30", ...values })) form.set(key, value);
  return form;
}

function medicationAdministrationForm(values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ medicationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", scheduleId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", status: "taken", administeredAt: "2026-11-20T09:00", administeredAtOffset: "-330", notes: "Fictional dose event", ...values })) form.set(key, value);
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

describe("timeline note edit and removal actions", () => {
  const eventId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const initialState = { status: "idle" as const, message: "" };
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  function editForm(values: Record<string, string> = {}) {
    const form = new FormData();
    for (const [key, value] of Object.entries({ patientId, eventId, eventType: "care_note", title: "Corrected fictional note", description: "Corrected fictional details", ...values })) form.set(key, value);
    return form;
  }

  it("updates only the authenticated author's unverified note fields", async () => {
    const relationship = query({ data: { status: "active", can_read: true, can_write: true }, error: null });
    const update = updateQuery({ data: { id: eventId }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships" ? relationship : update);
    const result = await updateHealthEvent(initialState, editForm());
    expect(result.status).toBe("success");
    expect(update.update).toHaveBeenCalledWith({ event_type: "care_note", title: "Corrected fictional note", description: "Corrected fictional details" });
    expect(update.eq).toHaveBeenCalledWith("created_by", "user-1");
    expect(update.eq).toHaveBeenCalledWith("verification_status", "unverified");
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}/reports`);
  });

  it("blocks editing for a read-only profile relationship", async () => {
    mockSupabase.from.mockReturnValue(query({ data: { status: "active", can_read: true, can_write: false }, error: null }) as never);
    const result = await updateHealthEvent(initialState, editForm());
    expect(result.status).toBe("error");
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });

  it("removes only the authenticated author's unverified note", async () => {
    const relationship = query({ data: { status: "active", can_read: true, can_write: true }, error: null });
    const remove = deleteQuery({ data: { id: eventId }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships" ? relationship : remove);
    const form = new FormData();
    form.set("patientId", patientId);
    form.set("eventId", eventId);
    const result = await deleteHealthEvent(initialState, form);
    expect(result.status).toBe("success");
    expect(remove.eq).toHaveBeenCalledWith("created_by", "user-1");
    expect(remove.eq).toHaveBeenCalledWith("verification_status", "unverified");
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
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

describe("adult and senior condition server action", () => {
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

  it("stores a patient-reported condition as unverified", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "senior" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "patient", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createMedicalCondition(patientId, { status: "idle", message: "" }, conditionForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, name: "Hypertension", status: "active", diagnosed_on: "2020-01-02", notes: "Fictional sample", reported_by: "patient", verification_status: "unverified", created_by: "user-1" }));
  });

  it("rejects child profiles and invalid dates", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const denied = await createMedicalCondition(patientId, { status: "idle", message: "" }, conditionForm());
    expect(denied.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
    const invalid = await createMedicalCondition(patientId, { status: "idle", message: "" }, conditionForm({ diagnosedOn: "2026-02-30" }));
    expect(invalid.status).toBe("error");
    expect(invalid.message).toMatch(/valid diagnosis date/i);
  });
});

describe("adult and senior caregiver task actions", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "senior" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("creates a task for the signed-in user and preserves the local due time", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "senior" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createCaregiverTask(patientId, { status: "idle", message: "" }, careTaskForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, title: "Prepare for appointment", due_at: "2026-11-20T03:30:00.000Z", assigned_to: "user-1", created_by: "user-1" }));
  });

  it("does not create a task for a child or a read-only relationship", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: false }, error: null }) : { insert });
    const result = await createCaregiverTask(patientId, { status: "idle", message: "" }, careTaskForm());
    expect(result.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("assigns a task only to a linked caregiver with active write access", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    let relationshipReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? query(relationshipReads++ === 0
        ? { data: { status: "active", can_read: true, can_write: true }, error: null }
        : { data: { user_id: "caregiver-1" }, error: null })
        : { insert });
    const result = await createCaregiverTask(patientId, { status: "idle", message: "" }, careTaskForm({ assignedTo: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }));
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ assigned_to: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", created_by: "user-1" }));
  });

  it("rejects assigning tasks to an unlinked account", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    let relationshipReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? query(relationshipReads++ === 0
        ? { data: { status: "active", can_read: true, can_write: true }, error: null }
        : { data: null, error: null })
        : { insert });
    const result = await createCaregiverTask(patientId, { status: "idle", message: "" }, careTaskForm({ assignedTo: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }));
    expect(result.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  it("updates task status only after verifying active write access", async () => {
    const update = vi.fn(() => ({ eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }, error: null }) }));
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { update });
    const form = new FormData();
    form.set("taskId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    form.set("status", "complete");
    const result = await updateCaregiverTaskStatus(patientId, { status: "idle", message: "" }, form);
    expect(result.status).toBe("success");
    expect(update).toHaveBeenCalledWith({ status: "complete" });
  });

  it("marks a task missed only after its due time has passed", async () => {
    const chain = { eq: vi.fn(() => chain), lte: vi.fn(() => chain), select: vi.fn(() => chain), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }, error: null }) };
    const update = vi.fn(() => chain);
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "adult" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { update });
    const form = new FormData();
    form.set("taskId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    form.set("status", "missed");
    const result = await updateCaregiverTaskStatus(patientId, { status: "idle", message: "" }, form);
    expect(result).toEqual({ status: "success", message: "Care task marked missed." });
    expect(update).toHaveBeenCalledWith({ status: "missed" });
    expect(chain.eq).toHaveBeenCalledWith("status", "open");
    expect(chain.lte).toHaveBeenCalledWith("due_at", expect.any(String));
  });

  it("does not update a task outside an adult or senior profile", async () => {
    const update = vi.fn();
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { update });
    const form = new FormData();
    form.set("taskId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    form.set("status", "complete");
    const result = await updateCaregiverTaskStatus(patientId, { status: "idle", message: "" }, form);
    expect(result.status).toBe("error");
    expect(update).not.toHaveBeenCalled();
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

describe("child vaccination server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves a caregiver-entered planned date without inventing a schedule", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createVaccinationRecord(patientId, { status: "idle", message: "" }, vaccinationForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, vaccine_name: "Fictional sample vaccine", status: "planned", due_on: "2026-12-15", administered_on: null, document_id: null, source: "caregiver", verification_status: "unverified", created_by: "user-1" }));
  });

  it("requires an administration date before marking a dose administered", async () => {
    const result = await createVaccinationRecord(patientId, { status: "idle", message: "" }, vaccinationForm({ status: "administered", dueOn: "", administeredOn: "" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/administration date/i);
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });
});

describe("child developmental milestone server action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships"
        ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null })
        : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves a caregiver-entered child observation without a developmental assessment", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_profiles"
      ? query({ data: { id: patientId, life_stage: "child" }, error: null })
      : table === "patient_relationships" ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const result = await createDevelopmentalMilestone(patientId, { status: "idle", message: "" }, milestoneForm({ status: "follow_up", followUpOn: "2026-12-01" }));
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, milestone_name: "Fictional sample observation", domain: "motor", status: "follow_up", recorded_on: "2026-11-20", follow_up_on: "2026-12-01", source: "caregiver", verification_status: "unverified", created_by: "user-1" }));
  });

  it("requires a follow-up date when follow-up is planned", async () => {
    const result = await createDevelopmentalMilestone(patientId, { status: "idle", message: "" }, milestoneForm({ status: "follow_up", followUpOn: "" }));
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/follow-up date/i);
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
      event_type: "doctor_appointment",
      title: "Fictional clinic visit",
      starts_at: "2026-11-21T03:30:00.000Z",
      source: "caregiver",
      status: "scheduled",
      created_by: "user-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("creates an event from the shared calendar form using the selected profile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { relationship_role: "guardian", status: "active", can_read: true, can_write: true }, error: null })
      : { insert });
    const result = await createCalendarAppointment({ status: "idle", message: "" }, appointmentForm({ eventType: "laboratory_test", title: "Fictional blood test", notes: "Fictional note" }));
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, event_type: "laboratory_test", title: "Fictional blood test", notes: "Fictional note", source: "caregiver" }));
  });

  it("updates a profile event using the browser timezone and invalidates the calendar", async () => {
    const update = updateQuery({ data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : update);
    const result = await updateAppointment(patientId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", { status: "idle", message: "" }, appointmentForm({ title: "Changed visit", startsAt: "2026-11-21T09:00", startsAtOffset: "-330" }));
    expect(result).toEqual({ status: "success", message: "Appointment updated." });
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Changed visit", starts_at: "2026-11-21T03:30:00.000Z" }));
    expect(update.eq).toHaveBeenCalledWith("patient_id", patientId);
    expect(revalidatePath).toHaveBeenCalledWith("/account/calendar");
  });

  it("removes an event only for a writable profile relationship", async () => {
    const removal = deleteQuery({ data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships" ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : removal);
    const result = await deleteAppointment(patientId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", { status: "idle", message: "" }, new FormData());
    expect(result).toEqual({ status: "success", message: "Appointment removed." });
    expect(removal.delete).toHaveBeenCalled();
    expect(removal.eq).toHaveBeenCalledWith("patient_id", patientId);
    expect(revalidatePath).toHaveBeenCalledWith("/account/calendar");
  });

  it("rejects removal without active write access", async () => {
    mockSupabase.from.mockImplementation(() => query({ data: { status: "active", can_read: true, can_write: false }, error: null }));
    const result = await deleteAppointment(patientId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", { status: "idle", message: "" }, new FormData());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("appointments");
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

  it("lets the author edit medicine-note details while preserving record status", async () => {
    const update = updateQuery({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, error: null });
    let medicationReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : (medicationReads++ === 0 ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", created_by: "user-1" }, error: null }) : update));
    const result = await updateMedicationDetails(patientId, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", { status: "idle", message: "" }, medicationForm({ medicineName: "Fictional changed medicine", genericName: "Fictional generic", strength: "10 mg" }));
    expect(result.status).toBe("success");
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ medicine_name: "Fictional changed medicine", generic_name: "Fictional generic", strength: "10 mg" }));
    expect(JSON.stringify(update.update.mock.calls)).not.toContain("status");
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}`);
  });

  it("does not let another linked user edit the author's medicine note", async () => {
    const update = updateQuery({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", created_by: "different-user" }, error: null }));
    const result = await updateMedicationDetails(patientId, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", { status: "idle", message: "" }, medicationForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/person who entered/i);
    expect(update.update).not.toHaveBeenCalled();
  });
});

describe("medication schedules and dose event actions", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves the entered schedule without enabling reminders", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : table === "medication_records" ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", status: "active", visibility: "general" }, error: null }) : { insert });
    const result = await createMedicationSchedule(patientId, { status: "idle", message: "" }, medicationScheduleForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, medication_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", frequency: "Twice daily as recorded", administration_times: ["08:00", "20:00"], reminder_enabled: false, status: "active", visibility: "general", created_by: "user-1" }));
  });

  it("rejects duplicate times and schedules for inactive medicines", async () => {
    const invalid = await createMedicationSchedule(patientId, { status: "idle", message: "" }, medicationScheduleForm({ administrationTimes: "08:00, 08:00" }));
    expect(invalid.status).toBe("error");
    expect(invalid.message).toMatch(/duplicate/i);
    expect(createClient).not.toHaveBeenCalled();
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : table === "medication_records" ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", status: "discontinued", visibility: "general" }, error: null }) : { insert: vi.fn() });
    const inactive = await createMedicationSchedule(patientId, { status: "idle", message: "" }, medicationScheduleForm());
    expect(inactive.status).toBe("error");
    expect(inactive.message).toMatch(/current medicine/i);
  });

  it("records a dose event with its linked active schedule and local timezone", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : table === "medication_records" ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", visibility: "general" }, error: null })
        : table === "medication_schedules" ? query({ data: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", status: "active" }, error: null }) : { insert });
    const result = await logMedicationAdministration(patientId, { status: "idle", message: "" }, medicationAdministrationForm());
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, medication_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", schedule_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", status: "taken", administered_at: "2026-11-20T03:30:00.000Z", recorded_by: "user-1", visibility: "general" }));
  });

  it("rejects a schedule that does not belong to this medication and patient", async () => {
    const insert = vi.fn();
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : table === "medication_records" ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", visibility: "general" }, error: null })
        : table === "medication_schedules" ? query({ data: null, error: null }) : { insert });
    const result = await logMedicationAdministration(patientId, { status: "idle", message: "" }, medicationAdministrationForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active schedule linked/i);
    expect(insert).not.toHaveBeenCalled();
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
    let medicationReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : (medicationReads++ === 0 ? query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", created_by: "user-1" }, error: null }) : update));

    const result = await updateMedicationStatus(patientId, { status: "idle", message: "" }, medicationStatusForm());

    expect(result).toEqual({ status: "success", message: "Medicine note moved to history." });
    expect(update.update).toHaveBeenCalledWith({ status: "historical" });
    expect(update.update).toHaveBeenCalledWith({ status: "paused", reminder_enabled: false });
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

  it("does not allow a linked user to change another author's medicine status", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : query({ data: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", created_by: "different-user" }, error: null }));
    const result = await updateMedicationStatus(patientId, { status: "idle", message: "" }, medicationStatusForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/person who entered/i);
    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });
});

describe("medicine note removal action", () => {
  const medicationId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const initialState = { status: "idle" as const, message: "" };
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  function removalForm() {
    const form = new FormData();
    form.set("confirmRemove", "remove");
    return form;
  }

  it("removes an author's discontinued note and restricts the row to removable statuses", async () => {
    const remove = deleteQuery({ data: { id: medicationId }, error: null });
    let medicationReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : (medicationReads++ === 0 ? query({ data: { id: medicationId, created_by: "user-1", status: "discontinued" }, error: null }) : remove));
    const result = await deleteMedicationNote(patientId, medicationId, initialState, removalForm());
    expect(result.status).toBe("success");
    expect(remove.eq).toHaveBeenCalledWith("created_by", "user-1");
    expect(remove.in).toHaveBeenCalledWith("status", ["discontinued", "historical"]);
    expect(revalidatePath).toHaveBeenCalledWith(`/account/patients/${patientId}/reports`);
  });

  it("keeps active notes and reports when linked schedule or dose history blocks removal", async () => {
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : query({ data: { id: medicationId, created_by: "user-1", status: "active" }, error: null }));
    const activeResult = await deleteMedicationNote(patientId, medicationId, initialState, removalForm());
    expect(activeResult.status).toBe("error");
    expect(activeResult.message).toMatch(/discontinued or historical/i);

    const remove = deleteQuery({ data: null, error: { code: "23503" } });
    let medicationReads = 0;
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : (medicationReads++ === 0 ? query({ data: { id: medicationId, created_by: "user-1", status: "historical" }, error: null }) : remove));
    const linkedResult = await deleteMedicationNote(patientId, medicationId, initialState, removalForm());
    expect(linkedResult.status).toBe("error");
    expect(linkedResult.message).toMatch(/linked schedule or dose history/i);
  });

  it("does not let another linked user remove the author's note", async () => {
    const remove = deleteQuery({ data: { id: medicationId }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : query({ data: { id: medicationId, created_by: "different-user", status: "historical" }, error: null }));
    const result = await deleteMedicationNote(patientId, medicationId, initialState, removalForm());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/person who entered/i);
    expect(remove.delete).not.toHaveBeenCalled();
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
    expect(revalidatePath).toHaveBeenCalledWith("/account/calendar");
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

describe("emergency assistance actions", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null })
      : { insert: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves an emergency contact without sending a notification", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const form = new FormData();
    form.set("displayName", "Fictional caregiver"); form.set("relationship", "Daughter"); form.set("phone", "+91 98765 43210"); form.set("priority", "1");
    const result = await createEmergencyContact(patientId, { status: "idle", message: "" }, form);
    expect(result).toEqual({ status: "success", message: "Emergency contact saved. They have not been notified." });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, display_name: "Fictional caregiver", phone: "+91 98765 43210", priority: 1, created_by: "user-1" }));
  });

  it("refuses to record an emergency action for a read-only relationship", async () => {
    mockSupabase.from.mockImplementation(() => query({ data: { status: "active", can_read: true, can_write: false }, error: null }));
    const form = new FormData(); form.set("alertType", "ambulance_call_requested");
    const result = await recordEmergencyAlert(patientId, { status: "idle", message: "" }, form);
    expect(result.status).toBe("error");
    expect(mockSupabase.from).not.toHaveBeenCalledWith("emergency_alerts");
  });

  it("records only that a user requested a manual emergency action", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : { insert });
    const form = new FormData(); form.set("alertType", "ambulance_call_requested");
    const result = await recordEmergencyAlert(patientId, { status: "idle", message: "" }, form);
    expect(result.status).toBe("success");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ patient_id: patientId, alert_type: "ambulance_call_requested", status: "created", created_by: "user-1", message: expect.stringContaining("No call, dispatch") }));
  });

  it("removes only the selected emergency contact from an authorized profile", async () => {
    const removal = deleteQuery({ data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" }, error: null });
    mockSupabase.from.mockImplementation((table: string) => table === "patient_relationships"
      ? query({ data: { status: "active", can_read: true, can_write: true }, error: null }) : removal);
    const result = await deleteEmergencyContact(patientId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", { status: "idle", message: "" }, new FormData());
    expect(result.status).toBe("success");
    expect(removal.delete).toHaveBeenCalled();
    expect(removal.eq).toHaveBeenCalledWith("patient_id", patientId);
  });
});

describe("caregiver handover action", () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("saves a point-in-time summary only from general records and to an active linked reader", async () => {
    const conditions = listQuery({ data: [{ name: "Fictional condition", status: "active", reported_by: "patient", verification_status: "unverified" }], error: null });
    const medicines = listQuery({ data: [{ medicine_name: "Fictional medicine", generic_name: null, strength: "10 mg", route: "oral", instructions: "As recorded", status: "active" }], error: null });
    const symptoms = listQuery({ data: [{ symptom: "Fictional symptom", severity: 2, notes: "Synthetic observation", observed_at: "2026-11-20T03:00:00.000Z" }], error: null });
    const appointments = listQuery({ data: [{ event_type: "laboratory_test", title: "Fictional blood test", starts_at: "2026-11-25T03:00:00.000Z", location: null, status: "scheduled" }], error: null });
    const empty = () => listQuery({ data: [], error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "patient_relationships") return query({ data: { status: "active", can_read: true, can_write: true }, error: null });
      if (table === "patient_profiles") return query({ data: { display_name: "Fictional patient", date_of_birth: "2000-01-02", life_stage: "adult" }, error: null });
      if (table === "medical_conditions") return conditions;
      if (table === "medication_records") return medicines;
      if (table === "symptom_observations") return symptoms;
      if (table === "appointments") return appointments;
      if (table === "caregiver_handover_records") return { insert };
      return empty();
    });
    const form = new FormData(); form.set("toUserId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"); form.set("note", "Call before the next visit.");
    const result = await createCaregiverHandover(patientId, { status: "idle", message: "" }, form);
    expect(result).toEqual({ status: "success", message: "Handover saved to this profile. No care access changed and no recipient was notified." });
    const [[record]] = JSON.parse(JSON.stringify(insert.mock.calls)) as [[{ handover_text: string; from_user_id: string; to_user_id: string; visibility: string }]];
    expect(record.from_user_id).toBe("user-1");
    expect(record.to_user_id).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(record.visibility).toBe("general");
    expect(record.handover_text).toContain("Fictional condition");
    expect(record.handover_text).toContain("Fictional medicine");
    expect(record.handover_text).toContain("Fictional blood test");
    expect(record.handover_text).toContain("NOT VERIFIED PRESCRIPTIONS");
    expect(record.handover_text).toContain("Call before the next visit.");
    expect(symptoms.eq).toHaveBeenCalledWith("visibility", "general");
    expect(conditions.eq).toHaveBeenCalledWith("visibility", "general");
    expect(medicines.eq).toHaveBeenCalledWith("visibility", "general");
  });

  it("does not save a handover if any source record could not be loaded", async () => {
    const insert = vi.fn();
    const empty = () => listQuery({ data: [], error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "patient_relationships") return query({ data: { status: "active", can_read: true, can_write: true }, error: null });
      if (table === "patient_profiles") return query({ data: { display_name: "Fictional patient", date_of_birth: null, life_stage: "adult" }, error: null });
      if (table === "symptom_observations") return listQuery({ data: null, error: new Error("read failed") });
      if (table === "caregiver_handover_records") return { insert };
      return empty();
    });
    const result = await createCaregiverHandover(patientId, { status: "idle", message: "" }, new FormData());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/no handover was saved/i);
    expect(insert).not.toHaveBeenCalled();
  });

  it("blocks free-text handover notes for adolescent profiles", async () => {
    const insert = vi.fn();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "patient_relationships") return query({ data: { status: "active", can_read: true, can_write: true }, error: null });
      if (table === "patient_profiles") return query({ data: { display_name: "Fictional adolescent", date_of_birth: "2010-01-01", life_stage: "adolescent" }, error: null });
      if (table === "caregiver_handover_records") return { insert };
      return listQuery({ data: [], error: null });
    });
    const form = new FormData(); form.set("note", "Private sensitive information");
    const result = await createCaregiverHandover(patientId, { status: "idle", message: "" }, form);
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/disabled for adolescent profiles/i);
    expect(insert).not.toHaveBeenCalled();
  });

  it("requires active write access before reading or saving handover records", async () => {
    mockSupabase.from.mockImplementation(() => query({ data: { status: "active", can_read: true, can_write: false }, error: null }));
    const result = await createCaregiverHandover(patientId, { status: "idle", message: "" }, new FormData());
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/active write access/i);
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
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
