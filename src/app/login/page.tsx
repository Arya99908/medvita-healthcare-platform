"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Heart, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
function getAuthCallbackError() { return new URLSearchParams(window.location.search).get("error") === "auth_callback"; }

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const authCallbackError = useSyncExternalStore(subscribeToLocation, getAuthCallbackError, () => false);
  const configured = hasSupabaseConfig();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!configured) { setMessage("Sign-in is unavailable until a Supabase project is configured."); return; }
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/account";
    setBusy(true);
    try {
      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
      if (result.error) setMessage(result.error.message);
      else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm the account before signing in.");
      else { router.push(nextPath); router.refresh(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to complete sign-in."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><section className="auth-card"><div className="auth-icon"><Heart size={22} /></div><span className="micro-label">YOUR HEALTH, YOUR WAY</span><h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1><p>Sign in to your private MedVita health space.</p>{authCallbackError && <p className="auth-message" role="status">We could not verify that sign-in link. Try again or request a fresh confirmation email.</p>}{!configured && <div className="setup-callout"><ShieldCheck size={18} /><div><strong>Secure sign-in setup is pending</strong><span>This demo remains open without an account. Connect a Supabase project to enable authentication and private profiles.</span></div></div>}<form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button className="primary-button auth-submit" type="submit" disabled={busy || !configured}><LockKeyhole size={16} />{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button></form>{message && <p className="auth-message" role="status">{message}</p>}{mode === "signin" && <Link className="auth-recovery-link" href="/reset-password">Forgot your password?</Link>}<button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New to MedVita? Create an account" : "Already have an account? Sign in"}</button><div className="auth-safe"><ShieldCheck size={15} /><span>Health details are protected by account permissions and consent.</span></div></section><Link className="back-to-demo" href="/"><ArrowLeft size={15} /> Return to fictional demo</Link><p className="auth-footnote">Demonstration interface · No real patient information</p></main>;
}
