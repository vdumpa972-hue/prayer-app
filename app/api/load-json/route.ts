import { NextResponse } from "next/server";

const MAX_JSON_BYTES = 1_000_000;

function getAllowedHosts() {
  return (process.env.ALLOWED_JSON_IMPORT_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedJsonUrl(rawUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Only HTTPS JSON URLs are allowed" };
  }

  const allowedHosts = getAllowedHosts();
  if (!allowedHosts.length) {
    return {
      ok: false,
      error: "Remote JSON import is disabled. Set ALLOWED_JSON_IMPORT_HOSTS in Vercel to enable trusted hosts.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowed = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));

  if (!allowed) {
    return { ok: false, error: "This JSON host is not approved for import" };
  }

  return { ok: true, url: parsed.toString() };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const validation = isAllowedJsonUrl(url.trim());
    if (!validation.ok || !validation.url) {
      return NextResponse.json({ error: validation.error || "Invalid URL" }, { status: 400 });
    }

    const response = await fetch(validation.url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Remote file is not JSON" }, { status: 400 });
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_JSON_BYTES) {
      return NextResponse.json({ error: "Remote JSON file is too large" }, { status: 400 });
    }

    const text = await response.text();
    if (text.length > MAX_JSON_BYTES) {
      return NextResponse.json({ error: "Remote JSON file is too large" }, { status: 400 });
    }

    const data = JSON.parse(text);

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
