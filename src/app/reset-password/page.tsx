"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = hasSupabaseConfig();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!configured) {
      setMessage("Password recovery is unavailable until a Supabase project is configured.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      setMessage(error
        ? "We could not send a reset link right now. Please try again later."
        : "If an account uses that email address, a password reset link has been sent.");
    } catch {
      setMessage("We could not send a reset link right now. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <Link className="brand auth-brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link>
    <section className="auth-card">
      <div className="auth-icon"><Mail size={21} /></div>
      <span className="micro-label">ACCOUNT RECOVERY</span>
      <h1>Reset your password</h1>
      <p>Enter your email and we’ll send a secure reset link if an account matches.</p>
      <form onSubmit={submit}>
        <label htmlFor="recovery-email">Email address</label>
        <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        <button className="primary-button auth-submit" type="submit" disabled={busy || !configured}>
          <Mail size={16} />{busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      {message && <p className="auth-message" role="status" aria-live="polite">{message}</p>}
      {!configured && <div className="setup-callout"><ShieldCheck size={18} /><div><strong>Secure sign-in setup is pending</strong><span>Connect the dedicated Supabase project to enable password recovery.</span></div></div>}
      <div className="auth-safe"><ShieldCheck size={15} /><span>For privacy, this page does not reveal whether an email has an account.</span></div>
    </section>
    <Link className="back-to-demo" href="/login"><ArrowLeft size={15} /> Return to sign in</Link>
    <p className="auth-footnote">Demonstration interface · No real patient information</p>
  </main>;
}
