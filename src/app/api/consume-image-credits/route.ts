import {
  CreditsTransType,
  decreaseCredits,
  InsufficientCreditsError,
} from "@/services/credit";
import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getAIChatCreditCost } from "@/services/config";

/**
 * POST /api/consume-image-credits
 * 消耗图片生成所需积分，生成前调用
 * 积分不足时返回 code: -3, insufficient: true
 */
export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const creditCost = getAIChatCreditCost();
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.ImageGen,
      credits: creditCost,
    });

    return respData({ success: true });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return respJson(-3, "insufficient credits", {
        insufficient: true,
        required: e.required,
        available: e.available,
      });
    }
    console.log("consume image credits failed:", e);
    return respErr("consume credits failed");
  }
}
