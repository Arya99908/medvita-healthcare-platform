"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Heart, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
function getAuthCallbackError() { return new URLSearchParams(window.location.search).get("error") === "auth_callback"; }
function getMfaRequired() { return new URLSearchParams(window.location.search).get("mfa") === "required"; }

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const authCallbackError = useSyncExternalStore(subscribeToLocation, getAuthCallbackError, () => false);
  const mfaRequested = useSyncExternalStore(subscribeToLocation, getMfaRequired, () => false);
  const configured = hasSupabaseConfig();

  function nextPath() {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    return requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/account";
  }

  const prepareMfaChallenge = useCallback(async () => {
    const supabase = createClient();
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel === "aal2" || assurance.nextLevel !== "aal2") return false;
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const factor = factors.totp[0];
    if (!factor) throw new Error("No verified authenticator is available for this account.");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) throw challengeError;
    setMfaFactorId(factor.id);
    setMfaChallengeId(challenge.id);
    setMfaRequired(true);
    return true;
  }, []);

  useEffect(() => {
    if (!mfaRequested || !configured) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void prepareMfaChallenge().then((required) => {
        if (active && !required) {
          setMessage("Your sign-in needs to be refreshed. Enter your email and password to continue.");
          window.history.replaceState(null, "", "/login");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }).catch(() => {
        if (active) {
          setMessage("We could not start authenticator verification. Sign in with your password to continue.");
          window.history.replaceState(null, "", `/login?next=${encodeURIComponent(nextPath())}`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [mfaRequested, configured, prepareMfaChallenge]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!configured) { setMessage("Sign-in is unavailable until a Supabase project is configured."); return; }
    const destination = nextPath();
    setBusy(true);
    try {
      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}` } });
      if (result.error) setMessage("Sign-in could not be completed. Check your email and password and try again.");
      else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm the account before signing in.");
      else if (mode === "signin" && await prepareMfaChallenge()) { setMessage(""); }
      else { router.push(destination); router.refresh(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to complete sign-in."); }
    finally { setBusy(false); }
  }

  async function verifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode.trim() });
      if (error) throw error;
      router.push(nextPath()); router.refresh();
    } catch {
      setMessage("That code could not be verified. Check the current code in your authenticator app and try again.");
      try {
        const { data: challenge } = await createClient().auth.mfa.challenge({ factorId: mfaFactorId });
        if (challenge) setMfaChallengeId(challenge.id);
      } catch { /* Keep the current challenge; the next verification will report if it expired. */ }
    } finally { setBusy(false); }
  }

  async function cancelMfa() {
    setBusy(true);
    await createClient().auth.signOut();
    setMfaRequired(false); setMfaFactorId(""); setMfaChallengeId(""); setMfaCode("");
    window.history.replaceState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
    setBusy(false);
  }

  return <main className="auth-page"><Link className="brand auth-brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><section className="auth-card"><div className="auth-icon"><Heart size={22} /></div><span className="micro-label">YOUR HEALTH, YOUR WAY</span>{mfaRequired ? <><h1>Verify your sign-in</h1><p>Enter the six-digit code from your authenticator app to continue.</p><form onSubmit={verifyMfa}><label htmlFor="login-mfa-code">Authenticator code</label><input id="login-mfa-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus /><button className="primary-button auth-submit" type="submit" disabled={busy || mfaCode.length !== 6}><ShieldCheck size={16} />{busy ? "Verifying…" : "Verify and continue"}</button></form><button type="button" className="auth-switch" disabled={busy} onClick={() => void cancelMfa()}>Cancel and sign out</button></> : <><h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1><p>Sign in to your private MedVita health space.</p>{authCallbackError && <p className="auth-message" role="status">We could not verify that sign-in link. Try again or request a fresh confirmation email.</p>}{!configured && <div className="setup-callout"><ShieldCheck size={18} /><div><strong>Secure sign-in setup is pending</strong><span>This demo remains open without an account. Connect a Supabase project to enable authentication and private profiles.</span></div></div>}<form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button className="primary-button auth-submit" type="submit" disabled={busy || !configured}><LockKeyhole size={16} />{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button></form>{mode === "signin" && <Link className="auth-recovery-link" href="/reset-password">Forgot your password?</Link>}<button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New to MedVita? Create an account" : "Already have an account? Sign in"}</button></>}{message && <p className="auth-message" role="status">{message}</p>}<div className="auth-safe"><ShieldCheck size={15} /><span>Health details are protected by account permissions and consent.</span></div></section><Link className="back-to-demo" href="/"><ArrowLeft size={15} /> Return to fictional demo</Link><p className="auth-footnote">Demonstration interface · No real patient information</p></main>;
}
