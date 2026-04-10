import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Recebe base64, faz upload no Supabase Storage, retorna URL pública */
export async function POST(req: Request) {
  try {
    const { base64, filename } = await req.json();

    if (!base64) {
      return NextResponse.json({ error: "base64 obrigatório" }, { status: 400 });
    }

    const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const contentType = `image/${matches[1]}`;
    const path = `uploads/upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const supabase = getServiceClient();
    const { error } = await supabase.storage
      .from("generations")
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("generations").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
