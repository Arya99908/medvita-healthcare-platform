"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const stages = ["infant", "child", "teen-girl", "teen-boy", "adult", "senior"] as const;
type Stage = typeof stages[number];
export type DemoSummaryState = {
  status: "idle" | "error" | "success";
  mode?: "sample" | "ai";
  message: string;
  overview?: string;
  facts?: string[];
};

const outputSchema = z.object({
  overview: z.string().trim().min(10).max(360),
  facts: z.array(z.string().trim().min(3).max(120)).max(4),
});

const samples: Record<Stage, { label: string; facts: string[] }> = {
  infant: { label: "infant", facts: ["A fictional feeding note is available.", "No real patient information is included."] },
  child: { label: "child", facts: ["A fictional growth measurement is available.", "No real patient information is included."] },
  "teen-girl": { label: "teenage girl", facts: ["The demonstration has general wellbeing notes only.", "No sensitive adolescent records are shared."] },
  "teen-boy": { label: "teenage boy", facts: ["The demonstration has general wellbeing notes only.", "No sensitive adolescent records are shared."] },
  adult: { label: "adult", facts: ["A fictional appointment and routine note are shown.", "No real patient information is included."] },
  senior: { label: "senior", facts: ["A fictional care-plan note is shown.", "No real patient information is included."] },
};

function sampleResult(stage: Stage): DemoSummaryState {
  const sample = samples[stage];
  return {
    status: "success",
    mode: "sample",
    message: "Sample mode · no AI provider was called.",
    overview: `This is a fictional ${sample.label} profile. The sample includes only demonstration notes and does not describe a real person.`,
    facts: sample.facts,
  };
}

export async function generateDemoSummary(_previous: DemoSummaryState, formData: FormData): Promise<DemoSummaryState> {
  const stageValue = formData.get("stage");
  if (typeof stageValue !== "string" || !stages.includes(stageValue as Stage)) {
    return { status: "error", message: "Choose a valid demonstration profile." };
  }
  const stage = stageValue as Stage;
  const model = process.env.MEDVITA_AI_MODEL?.trim();
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!model || !gatewayKey) return sampleResult(stage);

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return sampleResult(stage);

  const sample = samples[stage];
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: outputSchema }),
      system: "You rewrite a tiny synthetic healthcare demo snapshot in plain, accessible language. The input is fictional public demo data only. Never diagnose, infer a health condition, assess urgency, recommend treatment, suggest medication changes, or invent facts. Only restate the supplied facts. Keep the overview to two short sentences and return up to four supplied facts. Clearly preserve that the profile and records are fictional.",
      prompt: JSON.stringify({ lifeStage: sample.label, fictionalRecords: sample.facts }),
      abortSignal: AbortSignal.timeout(15_000),
    });
    const validated = outputSchema.safeParse(output);
    if (!validated.success) return { status: "error", message: "The AI response did not match the expected safe summary format. Try the sample mode later." };
    return { status: "success", mode: "ai", message: "AI-generated from fictional sample data. Review the wording; this is not medical advice.", ...validated.data };
  } catch {
    return { status: "error", message: "The AI service could not create a summary. Check the server-side provider configuration and try again." };
  }
}
