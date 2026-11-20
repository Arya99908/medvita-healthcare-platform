import { z } from "zod";

export const patientSummarySchema = z.object({
  summary: z.string().trim().min(20).max(1200),
  observations: z.array(z.object({
    text: z.string().trim().min(5).max(320),
    sourceIds: z.array(z.string().uuid()).min(1).max(8),
  })).max(8),
  questionsForClinician: z.array(z.string().trim().min(5).max(220)).max(5),
  missingInformation: z.array(z.string().trim().min(3).max(180)).max(5),
});

export type PatientSummary = z.infer<typeof patientSummarySchema>;
