import { NextResponse } from "next/server";
import { getUserProfileServer } from "@/lib/firebase-server";
import { getAppUrl, getStripe } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const uid = String(body.uid || "");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const profile = await getUserProfileServer(uid);
    const customerId = profile?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found for this account." }, { status: 400 });
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/subscription`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error: any) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: error?.message || "Could not open billing portal." }, { status: 500 });
  }
}
