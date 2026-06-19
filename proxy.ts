import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith("/master")) {
    const plan = request.cookies.get("plan")?.value;
    const trialEndRaw = request.cookies.get("trialEnd")?.value;
    const trialEnd = trialEndRaw ? Number(trialEndRaw) : NaN;

    if (!plan || plan === "free") {
      url.pathname = "/plans";
      url.search = "?from=master";
      return NextResponse.redirect(url);
    }

    if (plan === "trial" && Number.isFinite(trialEnd) && trialEnd <= Date.now()) {
      url.pathname = "/subscription";
      url.search = "?trialExpired=1";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/master/:path*"],
};
