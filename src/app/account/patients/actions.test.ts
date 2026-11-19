import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAppointment, createHealthEvent, createMedication, updateAppointmentStatus, updateMedicationStatus } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const patientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
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
