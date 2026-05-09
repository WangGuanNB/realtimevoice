/**
 * @fileoverview PayPal 支付 Checkout API
 * @description 创建 PayPal 支付订单并返回支付链接
 */

import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";

import { Order } from "@/types/order";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { orders } from "@/db/schema";
import { createPayPalOrder } from "@/services/paypal";

export async function POST(req: Request) {
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      cancel_url,
      locale,
    } = await req.json();

    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;

      if (cancel_url && cancel_url.startsWith("/")) {
        cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}${cancel_url}`;
      }
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    // 验证订单参数
    const page = await getPricingPage(locale);
    if (!page || !page.pricing || !page.pricing.items) {
      return respErr("invalid pricing table");
    }

    // 按 product_id + amount 精确匹配，支持 6 套餐
    const item = page.pricing.items.find(
      (i: PricingItem) =>
        i.product_id === product_id &&
        (currency === "cny" ? i.cn_amount === amount : i.amount === amount)
    );

    let isPriceValid = false;

    if (currency === "cny") {
      isPriceValid = item?.cn_amount === amount;
    } else {
      isPriceValid = item?.amount === amount && item?.currency === currency;
    }

    if (
      !item ||
      !item.amount ||
      !item.interval ||
      !item.currency ||
      item.interval !== interval ||
      item.credits !== credits ||
      item.valid_months !== valid_months ||
      !isPriceValid
    ) {
      return respErr("invalid checkout params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    // 获取用户信息
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    // 创建订单
    const order_no = getSnowId();
    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);

    expired_at = newDate.toISOString();

    const order = {
      order_no: order_no,
      created_at: new Date(created_at),
      user_uuid: user_uuid,
      user_email: user_email,
      amount: amount,
      interval: interval,
      expired_at: new Date(expired_at),
      status: "created",
      credits: credits,
      currency: currency,
      product_id: product_id,
      product_name: product_name,
      valid_months: valid_months,
    };
    await insertOrder(order as typeof orders.$inferInsert);

    // 构建成功和取消 URL
    // PayPal 支付成功后会重定向到 success_url，并带有 token 和 PayerID 参数
    const success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pay-success/paypal?order_no=${encodeURIComponent(order_no)}`;

    // 金额转换为分（PayPal 服务会转换为元）
    const amountInCents = Math.round(amount);

    // 创建 PayPal 订单
    try {
      console.log("🔔 [PayPal Checkout] 创建 PayPal 支付订单");
      const paypalOrder = await createPayPalOrder({
        amount: amountInCents,
        currency: currency,
        order_no: order_no,
        product_name: product_name,
        user_email: user_email,
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: {
          order_no: order_no,
          user_email: user_email,
          user_uuid: user_uuid,
          credits: credits,
          product_id: product_id,
        },
      });

      console.log("✅ [PayPal Checkout] PayPal 订单创建成功:", {
        order_id: paypalOrder.order_id,
        approval_url: paypalOrder.approval_url,
      });

      // 保存会话信息
      const order_detail = JSON.stringify({
        paypal_order_id: paypalOrder.order_id,
        approval_url: paypalOrder.approval_url,
        order_no: order_no,
        user_email: user_email,
        amount: amountInCents,
        currency: currency,
      });

      await updateOrderSession(order_no, paypalOrder.order_id, order_detail);

      return respData({
        approval_url: paypalOrder.approval_url,
        order_id: paypalOrder.order_id,
        order_no: order_no,
      });
    } catch (error: any) {
      console.error("❌ [PayPal Checkout] 创建 PayPal 订单失败:", error);
      return respErr("PayPal checkout failed: " + error.message);
    }
  } catch (e: any) {
    console.log("paypal checkout failed: ", e);
    return respErr("paypal checkout failed: " + e.message);
  }
}
