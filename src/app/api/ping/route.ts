import {
  CreditsAmount,
  CreditsTransType,
  decreaseCredits,
  InsufficientCreditsError,
} from "@/services/credit";
import { respData, respErr, respJson } from "@/lib/resp";

import { getUserUuid } from "@/services/user";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    // decrease credits for ping
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: CreditsAmount.PingCost,
    });

    return respData({
      pong: `received message: ${message}`,
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return respJson(-3, "insufficient credits", {
        insufficient: true,
        required: e.required,
        available: e.available,
      });
    }
    console.log("test failed:", e);
    return respErr("test failed");
  }
}
