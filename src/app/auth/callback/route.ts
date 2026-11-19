import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedPath = requestUrl.searchParams.get("next") ?? "/";
  const destination = new URL(requestedPath, requestUrl.origin);
  const safeDestination = destination.origin === requestUrl.origin ? destination : new URL("/", requestUrl.origin);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(safeDestination);
    } catch {
      // Missing project configuration and invalid/expired codes return to sign-in.
    }
  }

  const login = new URL("/login", requestUrl.origin);
  login.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(login);
}
