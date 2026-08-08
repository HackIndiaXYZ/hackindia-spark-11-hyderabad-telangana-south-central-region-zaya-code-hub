import { NextResponse } from "next/server";
import { Checkout } from "@dodopayments/nextjs";
import { z } from "zod";

const dodoEnvironment =
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";

const checkoutHandler = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || "dummy",
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL || "http://localhost:3000/build",
  environment: dodoEnvironment,
  type: "session",
}) as unknown as (request: Request) => Promise<Response>;

const PLAN_LOOKUP_KEY_VALUES = [
  "plan_starter_monthly",
  "plan_growth_monthly",
  "plan_scale_monthly",
] as const;

const createCheckoutSessionSchema = z.object({
  lookupKey: z.enum(PLAN_LOOKUP_KEY_VALUES, {
    message: "Invalid plan type",
  }),
  customer: z
    .object({
      email: z.string().email(),
      name: z.string().min(1),
    })
    .optional(),
});

const PRODUCT_ID_BY_LOOKUP_KEY = {
  ["plan_starter_monthly"]: process.env.DODO_PRODUCT_ID_STARTER,
  ["plan_growth_monthly"]: process.env.DODO_PRODUCT_ID_GROWTH,
  ["plan_scale_monthly"]: process.env.DODO_PRODUCT_ID_SCALE,
} as const;

export async function POST(request: Request) {
  try {
    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: "DODO_PAYMENTS_API_KEY is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const result = createCheckoutSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const { lookupKey, customer } = result.data;
    const productId = PRODUCT_ID_BY_LOOKUP_KEY[lookupKey];

    if (!productId) {
      return NextResponse.json(
        {
          error: `No Dodo product ID configured for '${lookupKey}'. Set DODO_PRODUCT_ID_STARTER, DODO_PRODUCT_ID_GROWTH, and DODO_PRODUCT_ID_SCALE in your env.`,
        },
        { status: 500 }
      );
    }

    const dodoPayload = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      ...(customer ? { customer } : {}),
      ...(process.env.DODO_PAYMENTS_RETURN_URL
        ? { return_url: process.env.DODO_PAYMENTS_RETURN_URL }
        : {}),
    };

    const transformedRequest = new Request(request.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dodoPayload),
    });

    return checkoutHandler(transformedRequest);
  } catch (error) {
    console.error("Error creating Dodo checkout session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to create Dodo checkout session" },
      { status: 500 }
    );
  }
}
