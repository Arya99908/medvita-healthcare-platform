import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptPatientInvitation } from "../actions";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token || !/^[0-9a-f]{64}$/i.test(token)) return <InvalidInvitation />;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(`/login?next=${encodeURIComponent(`/account/invitations/accept?token=${token}`)}`);
  const action = acceptPatientInvitation.bind(null, token);

  return <main className="account-page invitation-accept-page"><header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><Link href="/account" className="account-back-link">Your account</Link></header>
    <section className="account-card invitation-accept-card"><div className="account-card-heading"><div><span className="micro-label">CAREGIVER ACCESS</span><h1>Accept an invitation</h1><p>You’re signed in as <strong>{user.email}</strong>.</p></div><span className="account-card-icon"><Users size={18} /></span></div>
      <p className="invitation-safety-note">Continuing will link your account to a MedVita health profile. You’ll receive read access, and may also be able to add or update care records if the inviter allowed it. The profile owner controls access and can revoke it.</p>
      <form action={action} className="invitation-accept-form"><label><input type="checkbox" name="confirm" required /> I recognize the person who invited me and want to accept this access.</label><button className="primary-button" type="submit">Accept invitation</button></form>
      <Link href="/account" className="account-record-link">Cancel and return to account</Link>
    </section>
  </main>;
}

function InvalidInvitation() {
  return <main className="account-page invitation-accept-page"><section className="account-card invitation-accept-card"><ShieldCheck size={24} /><h1>Invitation link not available</h1><p>The link may be incomplete. Check that you copied it fully, then open it again while signed into the invited email account.</p><Link href="/account" className="account-record-link">Go to your account</Link></section></main>;
}
