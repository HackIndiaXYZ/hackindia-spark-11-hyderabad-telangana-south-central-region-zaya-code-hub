import { DodoCheckoutForm } from "@/components/dodo-checkout-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout — Zing",
  description: "Complete your payment for Zing Startup Builder",
};

const PLANS = [
  {
    id: "plan_starter_monthly",
    name: "Starter",
    price: "$19",
    cadence: "/ month",
    blurb: "Perfect for founders validating a first idea.",
    features: ["1 active workspace", "6-agent startup package", "Exportable launch assets"],
  },
  {
    id: "plan_growth_monthly",
    name: "Growth",
    price: "$49",
    cadence: "/ month",
    blurb: "For teams iterating fast and shipping weekly.",
    features: ["Unlimited workspaces", "Priority generation", "Team collaboration notes"],
  },
  {
    id: "plan_scale_monthly",
    name: "Scale",
    price: "$99",
    cadence: "/ month",
    blurb: "For founders building a full investor story.",
    features: ["Advanced strategy reviews", "Custom brand direction", "Dedicated launch support"],
  },
];

interface CheckoutPageProps {
  searchParams: Promise<{
    plan: string;
  }>;
}

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PaymentsPage({
  searchParams,
}: CheckoutPageProps) {
  const { plan: planId } = await searchParams;
  const plan = PLANS.find((p) => p.id === planId);

  if (!plan) {
    return notFound();
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    // If Supabase isn't configured, we'll allow access for local testing
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/login?next=/payments?plan=${planId}`);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
      <div className="container" style={{ margin: 'auto', padding: '40px 20px', maxWidth: '1000px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          {/* Left Column: Form */}
          <div style={{ padding: '40px' }}>
            <Link
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', fontSize: '14px', color: 'rgba(0,0,0,0.5)', textDecoration: 'none', marginBottom: '32px' }}>
              ← Back to plans
            </Link>

            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Subscribe to {plan.name}
              </h1>
              <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '15px' }}>{plan.blurb}</p>
            </div>

            <DodoCheckoutForm lookupKey={plan.id} />

            <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)', marginTop: '24px', lineHeight: 1.5 }}>
              By subscribing, you agree to our Terms of Service and authorize us
              to charge your card for future payments in accordance with our terms.
            </p>
          </div>

          {/* Right Column: Summary */}
          <div style={{ backgroundColor: '#F4F4F5', padding: '40px', borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 600 }}>{plan.price}</span>
                <span style={{ fontSize: '1.125rem', color: 'rgba(0,0,0,0.5)' }}>{plan.cadence}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.5)' }}>
                Zing AI Startup Builder
              </p>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h4 style={{ fontWeight: 500, marginBottom: '16px' }}>What's included</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                    <span style={{ color: '#000' }}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 500, marginBottom: '12px' }}>Secure checkout</h4>
              <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}>
                Your subscription is processed through Dodo Payments secure payment
                infrastructure. Sensitive payment details are never stored in this app.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
