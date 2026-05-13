/**
 * Stripe + Melio Configuration & API Helper
 * 
 * This file contains helper functions for both payment processors.
 * In production, these would be called from your Next.js API routes.
 */

// ============= STRIPE SETUP =============
// Install: npm install stripe @stripe/react-stripe-js @stripe/stripe-js

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY || "",
  secretKey: process.env.STRIPE_SECRET_KEY || "",
};

// Example: Create payment intent for receiving money
export async function createStripePaymentIntent(amount: number, description: string) {
  const response = await fetch("/api/stripe/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, description }),
  });
  return response.json();
}

// Example: Create ACH transfer via Stripe
export async function createStripeACHTransfer(
  amount: number,
  bankAccountToken: string,
  description: string
) {
  const response = await fetch("/api/stripe/create-ach-transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, bankAccountToken, description }),
  });
  return response.json();
}

// Example: Verify bank account with Plaid
export async function linkBankAccountWithPlaid() {
  const response = await fetch("/api/stripe/plaid-link-token", {
    method: "GET",
  });
  return response.json();
}

// ============= MELIO SETUP =============
// Install: npm install melio-sdk (or use HTTP API)

export const melioConfig = {
  apiKey: process.env.MELIO_SECRET_KEY || "",
  baseUrl: "https://api.melio.com/v1",
};

// Example: Send payment via Melio
export async function sendMelioPayment(
  vendorId: string,
  amount: number,
  description: string
) {
  const response = await fetch("/api/melio/send-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendorId, amount, description }),
  });
  return response.json();
}

// Example: Create Melio invoice
export async function createMelioInvoice(
  vendorEmail: string,
  amount: number,
  dueDate: string
) {
  const response = await fetch("/api/melio/create-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendorEmail, amount, dueDate }),
  });
  return response.json();
}

// Example: Get Melio vendors
export async function getMelioVendors() {
  const response = await fetch("/api/melio/vendors", {
    method: "GET",
  });
  return response.json();
}

// ============= TYPE DEFINITIONS =============

export interface StripeTransfer {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  status: "pending" | "in_transit" | "paid" | "failed" | "canceled";
  created: number;
}

export interface MelioPayment {
  id: string;
  amount: number;
  currency: string;
  vendor: {
    id: string;
    name: string;
  };
  status: "draft" | "scheduled" | "sent" | "failed" | "canceled";
  scheduledDate?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountHolderName: string;
  accountType: "checking" | "savings";
}
