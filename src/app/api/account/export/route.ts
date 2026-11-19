import { createClient } from "@/lib/supabase/server";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Sign in to download your account data." }, { status: 401, headers: privateHeaders });
  }

  const { data, error } = await supabase.rpc("export_my_data");
  if (error || !data) {
    return Response.json({ error: "Your account data could not be exported. Try again later." }, { status: 500, headers: privateHeaders });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      ...privateHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="medvita-account-export-${date}.json"`,
    },
  });
}
