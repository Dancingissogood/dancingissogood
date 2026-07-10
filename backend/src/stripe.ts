import Stripe from "stripe";

import { config } from "./config.js";

export function createStripeClient() {
  return new Stripe(config.stripeSecretKey, {
    apiVersion: "2026-06-24.dahlia",
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
}
