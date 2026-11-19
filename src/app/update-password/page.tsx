"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);
  const configured = hasSupabaseConfig();

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!configured) {
        setCheckingSession(false);
        return;
      }
      try {
        const { data, error } = await createClient().auth.getUser();
        if (active) setHasRecoverySession(!error && Boolean(data.user));
      } catch {
        if (active) setHasRecoverySession(false);
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => { active = false; };
  }, [configured]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!configured || !hasRecoverySession) {
      setMessage("This reset link has expired. Request a fresh password reset link.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) setMessage("The password could not be updated. Check its requirements and try again.");
      else setUpdated(true);
    } catch {
      setMessage("The password could not be updated. Request a fresh reset link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <Link className="brand auth-brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link>
    <section className="auth-card">
      <div className="auth-icon"><Heart size={22} /></div>
      <span className="micro-label">ACCOUNT RECOVERY</span>
      <h1>Choose a new password</h1>
      <p>Use a new password you do not use for another account.</p>
      {checkingSession ? <p className="auth-message" role="status">Checking your secure reset link…</p>
        : updated ? <><p className="auth-message" role="status">Your password has been updated.</p><button className="primary-button auth-submit" type="button" onClick={() => { router.push("/account"); router.refresh(); }}>Continue to your account</button></>
          : !hasRecoverySession ? <div className="setup-callout"><ShieldCheck size={18} /><div><strong>Reset link unavailable or expired</strong><span>Request a fresh link and open it on this device to continue.</span></div></div>
            : <form onSubmit={submit}>
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter it again" />
              <button className="primary-button auth-submit" type="submit" disabled={busy}><LockKeyhole size={16} />{busy ? "Updating…" : "Update password"}</button>
            </form>}
      {message && <p className="auth-message" role="status" aria-live="polite">{message}</p>}
      <div className="auth-safe"><ShieldCheck size={15} /><span>Password updates require the session opened from your reset email.</span></div>
    </section>
    <Link className="back-to-demo" href="/login"><ArrowLeft size={15} /> Return to sign in</Link>
    <p className="auth-footnote">Demonstration interface · No real patient information</p>
  </main>;
}
