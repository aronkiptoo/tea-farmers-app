import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type FarmerRow = {
  grower_number: string;
  name: string;
  national_id: string;
  mobile_number?: string | null;
  buying_center?: string | null;
  route?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = (body?.rows || []) as FarmerRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or API key in .env.local" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Deduplicate by national_id (last wins) — fixes:
    // "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const map = new Map<string, FarmerRow>();
    for (const f of rows) {
      const nid = String(f.national_id || "").trim();
      if (!nid) continue;
      map.set(nid, {
        grower_number: String(f.grower_number || "").trim(),
        name: String(f.name || "").trim(),
        national_id: nid,
        mobile_number: f.mobile_number
          ? String(f.mobile_number).trim()
          : null,
        buying_center: f.buying_center
          ? String(f.buying_center).trim()
          : null,
        route: f.route ? String(f.route).trim() : null,
      });
    }

    const unique = Array.from(map.values()).filter(
      (r) => r.grower_number && r.name && r.national_id
    );

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const batchSize = 50;

    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      const { error } = await supabase.from("Farmers").upsert(batch, {
        onConflict: "national_id",
        ignoreDuplicates: false,
      });

      if (error) {
        failed += batch.length;
        if (errors.length < 5) errors.push(error.message);
      } else {
        success += batch.length;
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors,
      total: rows.length,
      unique: unique.length,
      duplicates_removed: rows.length - unique.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
