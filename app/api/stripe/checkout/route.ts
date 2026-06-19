import { NextResponse } from "next/server";
import { getUserProfileServer, updateUserProfileServer } from "@/lib/firebase-server";
import { getAppUrl, getPriceId, getStripe } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const uid = String(body.uid || "");
    const email = String(body.email || "");
    const billingInterval = body.billingInterval === "annual" ? "annual" : "monthly";

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email." }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const profile = await getUserProfileServer(uid);

    let customerId = profile?.stripeCustomerId as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUid: uid,
        },
      });
      customerId = customer.id;
      await updateUserProfileServer(uid, {
        stripeCustomerId: customer.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      allow_promotion_codes: true,
      success_url: `${appUrl}/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/plans?canceled=1`,
      line_items: [
        {
          price: getPriceId(billingInterval),
          quantity: 1,
        },
      ],
      metadata: {
        firebaseUid: uid,
        billingInterval,
      },
      subscription_data: {
        metadata: {
          firebaseUid: uid,
          billingInterval,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: error?.message || "Could not create checkout session." }, { status: 500 });
  }
}
