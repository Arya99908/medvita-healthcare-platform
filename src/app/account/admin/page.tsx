import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import DoctorReviewForm from "./review-form";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: roles, error: roleError } = await supabase.from("user_roles")
    .select("role").eq("user_id", user.id).eq("role", "platform_admin");
  if (roleError || !roles?.some((role) => role.role === "platform_admin")) redirect("/account");

  const { data: doctors, error: doctorsError } = await supabase.from("doctors")
    .select("id,display_name,specialty,organisation,verification_status,created_at")
    .eq("verification_status", "pending").order("created_at", { ascending: true });
  const doctorIds = (doctors ?? []).map((doctor) => doctor.id);
  const { data: submissions, error: submissionsError } = doctorIds.length
    ? await supabase.from("doctor_verification_submissions")
      .select("doctor_id,registration_number,issuing_jurisdiction,submitted_at")
      .in("doctor_id", doctorIds)
    : { data: [], error: null };
  const submissionByDoctor = new Map((submissions ?? []).map((submission) => [submission.doctor_id, submission]));
  const loadError = Boolean(doctorsError || submissionsError);

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Account</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="account-layout admin-layout">
      <div className="account-main-column">
        <div className="account-welcome"><span className="micro-label">PLATFORM ADMINISTRATION</span><h1>Doctor verification</h1><p>Review submitted professional details before a doctor can access consented patient records.</p></div>
        <div className="account-safety-note"><ShieldCheck size={17} /><span>Verify each registration with the issuing council or another trusted source outside MedVita. This prototype does not connect to a professional registry or validate credentials automatically.</span></div>
        {loadError ? <div className="account-empty-state"><ShieldCheck size={22} /><strong>Review queue could not be loaded</strong><span>Refresh after checking the administrator role and database connection.</span></div>
          : doctors?.length ? <section className="account-card admin-review-queue" aria-labelledby="review-queue-title">
            <div className="account-card-heading"><div><span className="micro-label">PENDING APPLICATIONS</span><h2 id="review-queue-title">Applications to review</h2><p>Credential details are restricted to the applicant and platform administrators.</p></div><span className="account-card-icon"><ClipboardCheck size={18} /></span></div>
            <div className="admin-review-list">{doctors.map((doctor) => {
              const submission = submissionByDoctor.get(doctor.id);
              return <article className="admin-review-card" key={doctor.id}>
                <div className="admin-review-heading"><div><span className="micro-label">SUBMITTED {new Date(submission?.submitted_at ?? doctor.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span><h3>{doctor.display_name}</h3><p>{doctor.specialty || "Specialty not provided"}{doctor.organisation ? ` · ${doctor.organisation}` : ""}</p></div><span className="account-status pending">Pending</span></div>
                {submission ? <dl className="admin-credential-details"><div><dt>Registration number</dt><dd>{submission.registration_number}</dd></div><div><dt>Issuing council / jurisdiction</dt><dd>{submission.issuing_jurisdiction}</dd></div></dl>
                  : <p className="account-form-message error" role="status">Credential details are missing. Do not verify this application until they are resubmitted.</p>}
                {submission && <DoctorReviewForm doctorId={doctor.id} />}
              </article>;
            })}</div>
          </section> : <section className="account-card"><div className="account-empty-state"><ClipboardCheck size={23} /><strong>No applications are waiting</strong><span>New doctor submissions will appear here after they provide professional registration details.</span></div></section>}
        <p className="admin-scope-note">This workspace currently handles doctor verification only. Other administrator functions from the project brief need separate reviewed workflows.</p>
      </div>
    </div>
  </main>;
}
