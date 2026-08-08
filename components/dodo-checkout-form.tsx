"use client";

import * as React from "react";
import axios from "axios";

async function createCheckoutSession(
  lookupKey: string,
  customer: { email: string; name: string }
) {
  try {
    const response = await axios.post("/api/checkout", {
      lookupKey,
      customer,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to create checkout session"
      );
    }
    throw error;
  }
}

export function DodoCheckoutForm({ lookupKey }: { lookupKey: string }) {
  const [fullName, setFullName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [status, setStatus] = React.useState<"initial" | "processing" | "error">(
    "initial"
  );
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const getButtonText = () => {
    if (status === "processing") return "Redirecting...";
    if (status === "error") return "Try Again";
    return "Continue to Payment";
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;

    setStatus("processing");
    setErrorMessage("");

    try {
      const data = await createCheckoutSession(lookupKey, {
        email,
        name: fullName,
      });

      const checkoutUrl = data?.checkout_url || data?.checkoutUrl || data?.url;

      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        throw new Error("Checkout URL was not returned by Dodo Payments");
      }

      window.location.assign(checkoutUrl);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
      <div>
        <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full name</label>
        <input
          id="fullName"
          type="text"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
        <input
          id="email"
          type="email"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
      </div>
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
        type="submit"
        disabled={status === "processing"}
      >
        {getButtonText()}
      </button>
      {status === "error" && (
        <p style={{ color: 'red', fontSize: '0.875rem' }}>{errorMessage}</p>
      )}
    </form>
  );
}
