import { NextResponse } from "next/server";
import { isAllowedPushEndpoint, isValidSubscriptionKeys, saveSubscription } from "@/lib/push-server";
import { isSameOrigin } from "@/lib/request-guard";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { endpoint, keys } = await request.json();

    if (typeof endpoint !== "string" || !isAllowedPushEndpoint(endpoint)) {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }
    if (!keys || !isValidSubscriptionKeys(keys)) {
      return NextResponse.json({ error: "Invalid subscription keys" }, { status: 400 });
    }

    const id = await saveSubscription({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save subscription", details: error.message },
      { status: 500 }
    );
  }
}
