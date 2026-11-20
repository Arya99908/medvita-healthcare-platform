import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function InvalidInvitationPage() {
  return <main className="account-page invitation-accept-page"><section className="account-card invitation-accept-card"><ShieldCheck size={24} /><h1>Invitation link not available</h1><p>The invitation may have expired, been revoked, already been accepted, or may belong to a different confirmed email account. Ask the profile owner for a new link if you still need access.</p><Link href="/account" className="account-record-link">Go to your account</Link></section></main>;
}
