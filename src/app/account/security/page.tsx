import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import MfaPanel from "./mfa-panel";

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <main className="account-page">
    <header className="account-topbar"><Link className="brand" href="/"><span className="brand-symbol" aria-hidden="true"><span /><span /></span><span>med<span>vita</span></span></Link><div className="account-top-actions"><Link href="/account" className="account-back-link"><ArrowLeft size={15} /> Your profiles</Link><form action={signOut}><button type="submit" className="account-signout"><LogOut size={15} /> Sign out</button></form></div></header>
    <div className="account-layout"><div className="account-main-column"><div className="account-welcome"><span className="micro-label">PRIVATE ACCOUNT SETTINGS</span><h1>Sign-in security</h1><p>Choose whether to add an authenticator code when you sign in.</p></div><MfaPanel /><div className="account-safety-note"><ShieldCheck size={17} /><span>Authenticator verification is enforced at sign-in once enabled. You can manage your connected authenticator from this page.</span></div></div></div>
  </main>;
}
