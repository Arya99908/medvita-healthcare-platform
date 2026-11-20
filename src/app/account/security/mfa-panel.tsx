"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KeyRound, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string | null; created_at: string };
type Enrollment = { id: string; qr_code: string; secret: string; uri: string };

export default function MfaPanel() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [removing, setRemoving] = useState<Factor | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");

  async function loadFactors() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMessage("Authenticator settings could not be loaded. Refresh and try again.");
      setMessageKind("error");
    } else {
      setFactors(data.totp.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, created_at: factor.created_at })));
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void createClient().auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage("Authenticator settings could not be loaded. Refresh and try again.");
        setMessageKind("error");
      } else {
        setFactors(data.totp.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, created_at: factor.created_at })));
      }
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setMessage("Authenticator settings could not be loaded. Refresh and try again.");
      setMessageKind("error");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function beginEnrollment() {
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "MedVita authenticator", issuer: "MedVita" });
      if (error) throw error;
      setEnrollment({ id: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
      setCode("");
    } catch {
      setMessage("Authenticator setup could not start. Check that multi-factor authentication is enabled for this Supabase project.");
      setMessageKind("error");
    } finally { setBusy(false); }
  }

  async function verifyEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment) return;
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollment.id });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: enrollment.id, challengeId: challenge.id, code: code.trim() });
      if (verifyError) throw verifyError;
      setEnrollment(null); setCode(""); setMessage("Authenticator app verified and enabled."); setMessageKind("success");
      await loadFactors();
    } catch {
      setMessage("That code could not be verified. Check the current code in your authenticator app and try again.");
      setMessageKind("error");
    } finally { setBusy(false); }
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setBusy(true); setMessage("");
    let error: Error | null = null;
    try {
      const result = await createClient().auth.mfa.unenroll({ factorId: enrollment.id });
      error = result.error;
    } catch (caught) {
      error = caught instanceof Error ? caught : new Error("Cancellation failed");
    }
    if (error) {
      setMessage("Setup could not be cancelled. Try again before leaving this page.");
      setMessageKind("error");
    } else {
      setEnrollment(null); setCode("");
    }
    setBusy(false);
  }

  async function removeFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!removing) return;
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: removing.id });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: removing.id, challengeId: challenge.id, code: code.trim() });
      if (verifyError) throw verifyError;
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: removing.id });
      if (removeError) throw removeError;
      setRemoving(null); setCode(""); setMessage("Authenticator removed. Future sign-ins will no longer ask for its code."); setMessageKind("success");
      await loadFactors();
    } catch {
      setMessage("The code could not be confirmed or the authenticator could not be removed. Check the code and try again.");
      setMessageKind("error");
    } finally { setBusy(false); }
  }

  return <section className="account-card mfa-panel" aria-labelledby="mfa-heading">
    <div className="account-card-heading"><div><span className="micro-label">ACCOUNT SECURITY</span><h2 id="mfa-heading">Authenticator sign-in</h2><p>Add a time-based code from an authenticator app as a second sign-in step.</p></div><span className="account-card-icon"><ShieldCheck size={18} /></span></div>
    <p className="account-safety-note"><ShieldCheck size={16} /><span>Authenticator codes are checked by Supabase Auth. MedVita does not store your secret or recovery codes. Keep access to your authenticator app to avoid being locked out.</span></p>
    {message && <p className={`account-form-message ${messageKind}`} role="status">{message}</p>}
    {loading ? <p className="account-form-message" role="status"><LoaderCircle size={15} /> Loading authenticator settings…</p> : <>
      {factors.length > 0 ? <ul className="mfa-factor-list">{factors.map((factor) => <li key={factor.id}><span><KeyRound size={16} /><span><strong>{factor.friendly_name || "Authenticator app"}</strong><small>Added {new Date(factor.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small></span></span><button className="secondary-button" type="button" disabled={busy} onClick={() => { setRemoving(factor); setEnrollment(null); setCode(""); }}>Remove</button></li>)}</ul> : <p>No authenticator app is connected.</p>}
      {!enrollment && !removing && <button className="primary-button" type="button" disabled={busy} onClick={() => void beginEnrollment()}><KeyRound size={16} />{factors.length ? "Add another authenticator" : "Set up an authenticator"}</button>}
    </>}
    {enrollment && <div className="mfa-enrollment"><h3>Connect your authenticator app</h3><ol><li>Scan this QR code with an authenticator app.</li><li>Enter the six-digit code from the app to verify setup.</li></ol><Image unoptimized className="mfa-qr" src={enrollment.qr_code} width={200} height={200} alt="Authenticator setup QR code" /><p>If you cannot scan it, enter this setup key in your authenticator app:</p><code className="mfa-secret">{enrollment.secret}</code><details><summary>Show setup link</summary><code className="mfa-secret">{enrollment.uri}</code></details><form className="mfa-code-form" onSubmit={verifyEnrollment}><label htmlFor="mfa-enroll-code">6-digit authenticator code</label><input id="mfa-enroll-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /><button className="primary-button" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify and enable"}</button><button className="secondary-button" type="button" disabled={busy} onClick={() => void cancelEnrollment()}>Cancel setup</button></form></div>}
    {removing && <form className="mfa-code-form" onSubmit={removeFactor}><h3>Confirm authenticator removal</h3><p>Enter a current code from “{removing.friendly_name || "Authenticator app"}” to confirm this change.</p><label htmlFor="mfa-remove-code">6-digit authenticator code</label><input id="mfa-remove-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /><button className="secondary-button" type="submit" disabled={busy || code.length !== 6}><Trash2 size={15} />{busy ? "Confirming…" : "Verify and remove"}</button><button className="secondary-button" type="button" disabled={busy} onClick={() => { setRemoving(null); setCode(""); }}>Cancel</button></form>}
  </section>;
}
