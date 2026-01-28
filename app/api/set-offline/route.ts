import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId)
      return NextResponse.json({ error: "missing userId" }, { status: 400 });

    await supabase
      .from("users")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("userId", userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("set-offline error", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
