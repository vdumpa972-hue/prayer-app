import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserProfileServer } from "@/lib/firebase-server";
import { getStripe } from "@/lib/stripe-server";

function mapStatus(status?: string) {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled";
  if (status === "past_due" || status === "incomplete") return "overdue";
  return "free";
}

function mapInterval(interval?: string) {
  return interval === "year" ? "annual" : interval === "month" ? "monthly" : "none";
}

async function resolveFirebaseUid(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  explicitUid?: string
) {
  if (explicitUid) return explicitUid;

  const metadataUid = subscription.metadata?.firebaseUid;
  if (metadataUid) return metadataUid;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return null;

  return customer.metadata?.firebaseUid || null;
}

async function applySubscriptionToProfile(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  explicitUid?: string
) {
  const uid = await resolveFirebaseUid(stripe, subscription, explicitUid);
  if (!uid) return;

  const item = subscription.items.data[0];
  const interval = mapInterval(item?.price?.recurring?.interval);

  const currentPeriodEndRaw = (subscription as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;

  const currentPeriodEnd =
    typeof currentPeriodEndRaw === "number" ? currentPeriodEndRaw * 1000 : null;

  const updateData: Record<string, any> = {
    plan: subscription.status === "active" || subscription.status === "trialing" ? "paid" : "free",
    subscriptionStatus: mapStatus(subscription.status),
    subscriptionType:
      interval === "annual" ? "annual" : interval === "monthly" ? "monthly" : "free",
    billingInterval: interval,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: item?.price?.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  if (currentPeriodEnd) {
    updateData.renewalDate = currentPeriodEnd;
    updateData.stripeCurrentPeriodEnd = currentPeriodEnd;
  }

  await updateUserProfileServer(uid, updateData);
}

async function applyFromSubscriptionId(
  stripe: Stripe,
  subscriptionId?: string | null,
  explicitUid?: string
) {
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applySubscriptionToProfile(stripe, subscription, explicitUid);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error?.message);
    return NextResponse.json({ error: `Webhook Error: ${error?.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.firebaseUid;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (uid) {
          const seedData: Record<string, any> = {
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : session.customer?.id,
          };
          if (subscriptionId) {
            seedData.stripeSubscriptionId = subscriptionId;
          }
          await updateUserProfileServer(uid, seedData);
        }

        try {
          await applyFromSubscriptionId(stripe, subscriptionId, uid);
        } catch (innerError) {
          console.error("checkout.session.completed subscription sync failed:", innerError);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await applySubscriptionToProfile(stripe, subscription);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        await applyFromSubscriptionId(stripe, subscriptionId);
        break;
      }

      case "invoice_payment.paid": {
        const invoicePayment = event.data.object as {
          invoice?: string | (Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }) | null;
        };

        const invoiceId =
          typeof invoicePayment.invoice === "string"
            ? invoicePayment.invoice
            : invoicePayment.invoice?.id;

        if (invoiceId) {
          const invoice = (await stripe.invoices.retrieve(invoiceId)) as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          };
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id;
          await applyFromSubscriptionId(stripe, subscriptionId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler failure:", error);
    return NextResponse.json({ error: error?.message || "Webhook handler error" }, { status: 500 });
  }
}
