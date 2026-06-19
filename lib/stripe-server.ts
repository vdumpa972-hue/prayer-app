import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });
  }

  return stripeClient;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://prayer-master.vercel.app";
}

export function getPriceId(billingInterval: "monthly" | "annual") {
  if (billingInterval === "annual") {
    if (!process.env.STRIPE_PRICE_ANNUAL) {
      throw new Error("Missing STRIPE_PRICE_ANNUAL");
    }
    return process.env.STRIPE_PRICE_ANNUAL;
  }

  if (!process.env.STRIPE_PRICE_MONTHLY) {
    throw new Error("Missing STRIPE_PRICE_MONTHLY");
  }
  return process.env.STRIPE_PRICE_MONTHLY;
}
