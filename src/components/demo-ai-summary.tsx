"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { generateDemoSummary, type DemoSummaryState } from "@/app/actions/demo-ai-summary";
import type { DemoProfile } from "@/lib/demo-data";

const initialState: DemoSummaryState = { status: "idle", message: "" };

export default function DemoAISummary({ profile }: { profile: DemoProfile }) {
  const [state, action, pending] = useActionState(generateDemoSummary, initialState);
  return <section className="ai-demo-card" aria-labelledby="demo-ai-title">
    <div className="ai-card-top"><span className="ai-spark"><Sparkles size={17} /></span><span className="micro-label">MEDVITA INSIGHTS</span></div>
    <h3 id="demo-ai-title">A simpler profile summary</h3>
    <p>Show a short summary using fictional information for the selected {profile.label.toLowerCase()} profile.</p>
    <form action={action}><input type="hidden" name="stage" value={profile.id} /><button className="ai-summary-button" type="submit" disabled={pending}>{pending ? "Preparing…" : "Create sample summary"}</button></form>
    {state.status === "success" && <div className="ai-summary-result" aria-live="polite"><span className="coming-label">{state.mode === "ai" ? "AI · FICTIONAL DATA" : "SAMPLE MODE"}</span><p>{state.overview}</p>{state.facts && <ul>{state.facts.map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}</ul>}<small>{state.message}</small></div>}
    {state.status === "error" && <p className="ai-summary-error" role="alert">{state.message}</p>}
    <p className="ai-summary-note">Never a diagnosis or treatment recommendation. Real health records are not sent to AI.</p>
  </section>;
}
