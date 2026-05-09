/**
 * @fileoverview 统一支付 Checkout API
 * @description 根据配置自动选择支付方式（Stripe > PayPal > Creem），创建订单并返回支付链接
 */

import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { selectPaymentMethod } from "@/services/payment-selector";
import { findUserByUuid } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { getPricingPage } from "@/services/page";
import { PricingItem } from "@/types/blocks/pricing";
import { orders } from "@/db/schema";
import Stripe from "stripe";
import { createCreemCheckoutSession } from "@/services/creem";
import { createPayPalOrder } from "@/services/paypal";

/**
 * 通用订单验证和创建逻辑
 */
async function validateAndCreateOrder(params: {
  credits?: number;
  currency: string;
  amount: number;
  interval: string;
  product_id: string;
  product_name?: string;
  valid_months?: number;
  locale: string;
  pay_type?: string;
}) {
  const { credits, currency, amount, interval, product_id, product_name, valid_months, locale, pay_type } = params;

  // 参数验证
  if (!amount || !interval || !currency || !product_id) {
    throw new Error("invalid params");
  }

  // 验证订单参数
  const page = await getPricingPage(locale);
  if (!page || !page.pricing || !page.pricing.items) {
    throw new Error("invalid pricing table");
  }

  // 按 product_id + amount 精确匹配，支持 6 套餐（含 monthly/yearly 同 product_id 不同金额）
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
    throw new Error("invalid checkout params");
  }

  if (!["year", "month", "one-time"].includes(interval)) {
    throw new Error("invalid interval");
  }

  const is_subscription = interval === "month" || interval === "year";

  if (interval === "year" && valid_months !== 12) {
    throw new Error("invalid valid_months");
  }

  if (interval === "month" && valid_months !== 1) {
    throw new Error("invalid valid_months");
  }

  // 获取用户信息
  const user_uuid = await getUserUuid();
  if (!user_uuid) {
    throw new Error("no auth, please sign-in");
  }

  let user_email = await getUserEmail();
  if (!user_email) {
    const user = await findUserByUuid(user_uuid);
    if (user) {
      user_email = user.email;
    }
  }
  if (!user_email) {
    throw new Error("invalid user");
  }

  // 创建订单
  const order_no = getSnowId();
  const currentDate = new Date();
  const created_at = currentDate.toISOString();

  let expired_at = "";
  const timePeriod = new Date(currentDate);
  timePeriod.setMonth(currentDate.getMonth() + (valid_months || 0));

  const timePeriodMillis = timePeriod.getTime();
  let delayTimeMillis = 0;

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
    pay_type: pay_type,
  };
  await insertOrder(order as typeof orders.$inferInsert);

  return {
    order_no,
    user_uuid,
    user_email,
    item,
    is_subscription,
    locale,
  };
}

/**
 * 处理 Stripe 支付
 */
async function handleStripeCheckout(params: {
  order_no: string;
  user_uuid: string;
  user_email: string;
  product_name?: string;
  amount: number;
  currency: string;
  interval: string;
  is_subscription: boolean;
  credits?: number;
  locale: string;
  cancel_url: string;
}) {
  const { order_no, user_uuid, user_email, product_name, amount, currency, interval, is_subscription, credits, locale, cancel_url } = params;

  if (!process.env.STRIPE_PRIVATE_KEY) {
    throw new Error("STRIPE_PRIVATE_KEY is not configured");
  }

  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

  let options: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: product_name || "Product",
          },
          unit_amount: amount,
          recurring: is_subscription
            ? {
                interval: interval as "month" | "year",
              }
            : undefined,
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    metadata: {
      project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
      product_name: product_name || "",
      order_no: order_no.toString(),
      user_email: user_email,
      credits: credits?.toString() || "0",
      user_uuid: user_uuid,
    },
    mode: is_subscription ? "subscription" : "payment",
    success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pay-success/{CHECKOUT_SESSION_ID}`,
    cancel_url: cancel_url,
  };

  if (user_email) {
    options.customer_email = user_email;
  }

  if (is_subscription) {
    options.subscription_data = {
      metadata: options.metadata,
    };
  }

  if (currency === "cny") {
    options.payment_method_types = ["wechat_pay", "alipay", "card"];
    options.payment_method_options = {
      wechat_pay: {
        client: "web",
      },
      alipay: {},
    };
  }

  const order_detail = JSON.stringify(options);
  const session = await stripe.checkout.sessions.create(options);
  const stripe_session_id = session.id;
  await updateOrderSession(order_no, stripe_session_id, order_detail);

  return {
    public_key: process.env.STRIPE_PUBLIC_KEY,
    order_no: order_no,
    session_id: stripe_session_id,
    payment_method: "stripe",
  };
}

/**
 * 处理 PayPal 支付
 */
async function handlePayPalCheckout(params: {
  order_no: string;
  user_uuid: string;
  user_email: string;
  product_name?: string;
  amount: number;
  currency: string;
  credits?: number;
  product_id: string;
  locale: string;
  cancel_url: string;
}) {
  const { order_no, user_uuid, user_email, product_name, amount, currency, credits, product_id, locale, cancel_url } = params;

  const success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pay-success/paypal?order_no=${encodeURIComponent(order_no)}`;
  const amountInCents = Math.round(amount);

  const paypalOrder = await createPayPalOrder({
    amount: amountInCents,
    currency: currency,
    order_no: order_no,
    product_name: product_name || "Product",
    user_email: user_email,
    success_url: success_url,
    cancel_url: cancel_url,
    metadata: {
      order_no: order_no,
      user_email: user_email,
      user_uuid: user_uuid,
      credits: credits || 0,
      product_id: product_id,
    },
  });

  const order_detail = JSON.stringify({
    paypal_order_id: paypalOrder.order_id,
    approval_url: paypalOrder.approval_url,
    order_no: order_no,
    user_email: user_email,
    amount: amountInCents,
    currency: currency,
  });

  await updateOrderSession(order_no, paypalOrder.order_id, order_detail);

  return {
    approval_url: paypalOrder.approval_url,
    order_id: paypalOrder.order_id,
    order_no: order_no,
    payment_method: "paypal",
  };
}

/**
 * 处理 Creem 支付
 */
async function handleCreemCheckout(params: {
  order_no: string;
  user_uuid: string;
  user_email: string;
  product_name?: string;
  amount: number;
  currency: string;
  credits?: number;
  product_id: string;
  locale: string;
  cancel_url: string;
  creem_product_id?: string;
}) {
  const { order_no, user_uuid, user_email, product_name, amount, currency, credits, product_id, locale, cancel_url, creem_product_id } = params;

  // 🔥 6 套餐 Creem 产品 ID 映射
  const creemProductIdMap: Record<string, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STARTER_MONTHLY,
    starter_yearly: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STARTER_YEARLY,
    standard_monthly: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STANDARD_MONTHLY,
    standard_yearly: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STANDARD_YEARLY,
    premium_monthly: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_PREMIUM_MONTHLY,
    premium_yearly: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_PREMIUM_YEARLY,
  };

  // 优先级：creem_product_id(prod_* 直接用) > creem_product_id(key 查表) > product_id 查表 > 默认 > product_id
  const finalCreemProductId =
    (creem_product_id?.startsWith("prod_") ? creem_product_id : undefined) ||
    (creem_product_id ? creemProductIdMap[creem_product_id] : undefined) ||
    creemProductIdMap[product_id] ||
    product_id;

  const success_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pay-success/creem`;
  const amountInCents = Math.round(amount);

  let checkout_url: string | undefined;
  let session_id: string | undefined;

  const creemApiKey = process.env.CREEM_API_KEY;

  if (creemApiKey) {
    try {
      const checkoutSession = await createCreemCheckoutSession({
        product_id: finalCreemProductId,
        product_name: product_name || "Product",
        amount: amountInCents,
        currency: currency,
        order_no: order_no,
        user_email: user_email,
        user_uuid: user_uuid,
        credits: credits || 0,
        locale: locale,
        success_url: success_url,
        cancel_url: cancel_url,
        is_subscription: false,
      });

      checkout_url = checkoutSession.checkout_url;
      session_id = checkoutSession.session_id;
    } catch (error: any) {
      console.error("❌ [Creem Checkout] API 创建支付会话失败:", error);
    }
  }

  if (!checkout_url) {
    if (!finalCreemProductId) {
      throw new Error("Creem product ID is required when API Key is not configured");
    }

    const { isCreemTestMode } = await import("@/services/config");
    const isTestMode = isCreemTestMode();
      const baseUrl = isTestMode
        ? "https://www.creem.io/test/payment"
        : "https://www.creem.io/payment";

      checkout_url = `${baseUrl}/${finalCreemProductId}?order_no=${encodeURIComponent(order_no)}&email=${encodeURIComponent(user_email)}`;
      session_id = finalCreemProductId;
  }

  if (!checkout_url || !session_id) {
    throw new Error("Failed to create checkout session");
  }

  const order_detail = JSON.stringify({
    checkout_url,
    session_id,
    creem_product_id: finalCreemProductId,
    order_no: order_no,
    user_email: user_email,
    amount: amountInCents,
  });

  await updateOrderSession(order_no, session_id, order_detail);

  return {
    checkout_url: checkout_url,
    session_id: session_id,
    order_no: order_no,
    payment_method: "creem",
  };
}

export async function POST(req: Request) {
  try {
    // 1. 解析请求参数
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
      creem_product_id, // Creem 产品 ID（可选）
      payment_method, // 用户选择的支付方式
    } = await req.json();

    // 2. 确定支付方式：优先使用用户选择的，否则自动选择
    let paymentMethod = payment_method;
    if (!paymentMethod) {
      paymentMethod = selectPaymentMethod();
      if (!paymentMethod) {
        return respErr("No payment method available. Please configure at least one payment gateway.");
      }
    }

    // 3. 处理 cancel_url
    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;

      if (cancel_url && cancel_url.startsWith("/")) {
        cancel_url = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}${cancel_url}`;
      }
    }

    // 4. 验证并创建订单
    const orderData = await validateAndCreateOrder({
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      locale,
      pay_type: paymentMethod,
    });

    // 5. 根据选择的支付方式处理支付
    let result: any;
    switch (paymentMethod) {
      case "stripe":
        result = await handleStripeCheckout({
          order_no: orderData.order_no,
          user_uuid: orderData.user_uuid,
          user_email: orderData.user_email,
          product_name: product_name,
          amount: amount,
          currency: currency,
          interval: interval,
          is_subscription: orderData.is_subscription,
          credits: credits,
          locale: locale,
          cancel_url: cancel_url,
        });
        break;

      case "paypal":
        result = await handlePayPalCheckout({
          order_no: orderData.order_no,
          user_uuid: orderData.user_uuid,
          user_email: orderData.user_email,
          product_name: product_name,
          amount: amount,
          currency: currency,
          credits: credits,
          product_id: product_id,
          locale: locale,
          cancel_url: cancel_url,
        });
        break;

      case "creem":
        result = await handleCreemCheckout({
          order_no: orderData.order_no,
          user_uuid: orderData.user_uuid,
          user_email: orderData.user_email,
          product_name: product_name,
          amount: amount,
          currency: currency,
          credits: credits,
          product_id: product_id,
          locale: locale,
          cancel_url: cancel_url,
          creem_product_id: creem_product_id,
        });
        break;

      default:
        return respErr(`Unsupported payment method: ${paymentMethod}`);
    }

    // 6. 返回统一格式的响应
    return respData(result);
  } catch (e: any) {
    console.error("❌ [Checkout API] Checkout failed: ", e);
    return respErr(e.message || "checkout failed");
  }
}
