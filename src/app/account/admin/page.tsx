import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import DoctorReviewForm from "./review-form";
import AccountDeletionReviewForm from "./account-deletion-review-form";

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
  const { data: reviewHistory, error: historyError } = await supabase.from("audit_logs")
    .select("id,actor_user_id,action,resource_id,metadata,created_at")
    .eq("resource_type", "doctor").in("action", ["doctor_application_verified", "doctor_application_rejected"])
    .order("created_at", { ascending: false }).limit(100);
  const reviewedDoctorIds = [...new Set((reviewHistory ?? []).map((entry) => entry.resource_id).filter((id): id is string => Boolean(id)))];
  const { data: reviewedDoctors } = reviewedDoctorIds.length
    ? await supabase.from("doctors").select("id,display_name").in("id", reviewedDoctorIds)
    : { data: [] };
  const reviewedDoctorById = new Map((reviewedDoctors ?? []).map((doctor) => [doctor.id, doctor.display_name]));
  const { data: deletionRequests, error: deletionRequestsError } = await supabase.from("account_deletion_requests")
    .select("id,user_id,requested_at,reauthenticated_at,status,reviewed_at,review_note")
    .order("requested_at", { ascending: false }).limit(100);
  const deletionStatuses: Record<string, string> = {
    requested: "Waiting for review",
    withdrawn: "Withdrawn",
    ready_for_manual_processing: "Ready for manual processing",
    retention_review: "Retention review needed",
    declined: "Declined",
  };

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
        <section className="account-card admin-review-queue admin-deletion-queue" aria-labelledby="deletion-queue-title">
          <div className="account-card-heading"><div><span className="micro-label">ACCOUNT REQUESTS</span><h2 id="deletion-queue-title">Deletion review queue</h2><p>Requests are re-authenticated in the account flow. This queue does not delete accounts or health records.</p></div><span className="account-card-icon"><ShieldCheck size={18} /></span></div>
          {deletionRequestsError ? <div className="account-empty-state"><strong>Deletion requests could not be loaded</strong><span>Check the deletion-request migration and administrator role.</span></div>
            : deletionRequests?.length ? <div className="admin-review-list">{deletionRequests.map((request) => <article className="admin-deletion-card" key={request.id}>
              <div className="admin-review-heading"><div><span className="micro-label">REQUEST {request.id.slice(0, 8)}</span><h3>{request.user_id ? `Account ${request.user_id}` : "Account identifier removed"}</h3></div><span className={`account-status ${request.status === "requested" ? "pending" : request.status === "declined" || request.status === "withdrawn" ? "inactive" : "active"}`}>{deletionStatuses[request.status] ?? request.status}</span></div>
              <div className="admin-deletion-meta"><span>Requested {new Date(request.requested_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>{request.reviewed_at && <span>Reviewed {new Date(request.reviewed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>}</div>
              {request.review_note && <p>{request.review_note}</p>}
              {request.status === "requested" && <AccountDeletionReviewForm requestId={request.id} />}
            </article>)}</div> : <div className="account-empty-state"><strong>No account deletion requests</strong><span>Requests will appear here for review.</span></div>}
          <p className="admin-scope-note">“Ready for manual processing” is not completion. An authorised operator must follow approved retention and deletion rules separately.</p>
        </section>
        <section className="account-card admin-history-card" aria-labelledby="review-history-title">
          <div className="account-card-heading"><div><span className="micro-label">AUDIT HISTORY</span><h2 id="review-history-title">Doctor review decisions</h2><p>Recent verification decisions and administrator notes. Patient audit events are not included.</p></div><span className="account-card-icon"><ShieldCheck size={18} /></span></div>
          {historyError ? <div className="account-empty-state"><strong>Review history could not be loaded</strong><span>Try again after checking administrator access.</span></div>
            : reviewHistory?.length ? <div className="admin-history-list">{reviewHistory.map((entry) => {
              const metadata = typeof entry.metadata === "object" && entry.metadata !== null && !Array.isArray(entry.metadata) ? entry.metadata : {};
              const reason = "reason" in metadata && typeof metadata.reason === "string" ? metadata.reason : "";
              const decision = entry.action === "doctor_application_verified" ? "Verified" : "Rejected";
              return <article className="admin-history-row" key={entry.id}><div><strong>{reviewedDoctorById.get(entry.resource_id ?? "") ?? "Doctor application"}</strong><span>{decision} · {new Date(entry.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>{reason && <p>{reason}</p>}</div><small>Admin {entry.actor_user_id?.slice(0, 8) ?? "system"}</small></article>;
            })}</div> : <div className="account-empty-state"><strong>No review decisions recorded</strong><span>Completed reviews will be listed here.</span></div>}
        </section>
        <p className="admin-scope-note">This workspace currently handles doctor verification and its review history only. Other administrator functions from the project brief need separate reviewed workflows.</p>
      </div>
    </div>
  </main>;
}
