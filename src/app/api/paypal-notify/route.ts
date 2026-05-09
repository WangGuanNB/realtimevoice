/**
 * @fileoverview PayPal Webhook 通知处理
 * @description 处理 PayPal 支付成功回调
 */

import { handlePayPalOrder } from "@/services/order";
import { respOk } from "@/lib/resp";
import {
  verifyPayPalWebhookSignature,
  parsePayPalWebhookEvent,
} from "@/services/paypal";

export async function POST(req: Request) {
  try {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error("invalid PayPal config");
    }

    const body = await req.text();
    if (!body) {
      throw new Error("invalid notify data");
    }

    // 验证 Webhook 签名
    const headers = req.headers;
    const isValid = await verifyPayPalWebhookSignature(
      body,
      headers,
      paypalWebhookId
    );

    if (paypalWebhookId && !isValid) {
      throw new Error("invalid webhook signature");
    }
    if (!paypalWebhookId) {
      console.warn("⚠️ [PayPal Webhook] PAYPAL_WEBHOOK_ID 未配置，跳过签名验证（仅开发环境适用）");
    }

    // 解析事件数据
    const eventData = JSON.parse(body);
    const { type, data } = parsePayPalWebhookEvent(eventData);

    console.log("🔔 [PayPal Webhook] 收到事件:", type);
    console.log("🔔 [PayPal Webhook] 事件数据:", JSON.stringify(data, null, 2));

    // 仅对「支付已捕获」类事件标记订单为已支付。
    // PAYMENT.CAPTURE.COMPLETED: 资金已入账，resource 为 Capture，含 supplementary_data.related_ids.order_id。
    // CHECKOUT.ORDER.APPROVED: 仅买家同意，未捕获，不标记已支付。
    // PAYMENT.SALE.COMPLETED: 旧版 API 的支付完成事件。
    switch (type) {
      case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.SALE.COMPLETED": {
        await handlePayPalOrder(data, type);
        break;
      }
      case "CHECKOUT.ORDER.APPROVED":
        console.log("⚠️ [PayPal Webhook] CHECKOUT.ORDER.APPROVED 已跳过（不标记已支付）");
        break;

      default:
        console.log("⚠️ [PayPal Webhook] 未处理的事件类型:", type);
    }

    return respOk();
  } catch (e: any) {
    console.log("paypal notify failed: ", e);
    return Response.json(
      { error: `handle paypal notify failed: ${e.message}` },
      { status: 500 }
    );
  }
}
