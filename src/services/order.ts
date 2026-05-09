import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./credit";
import {
  findOrderByOrderNo,
  OrderStatus,
  updateOrderStatus,
  findOrderByEmailAndAmount,
} from "@/models/order";
import { getIsoTimestr } from "@/lib/time";
import { gte, desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliate";
import { Order } from "@/types/order";
import { sendOrderConfirmationEmail } from "./email";

/**
 * Creem 支付数据接口
 */
interface CreemPaymentData {
  order_no?: string;
  order_id?: string;
  metadata?: {
    order_no?: string;
    order_id?: string;
    user_email?: string;
    user_uuid?: string;
    credits?: string;
  };
  customer_email?: string;
  email?: string;
  status?: string;
  payment_status?: string;
  amount?: number;
  currency?: string;
  [key: string]: any;
}

export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== OrderStatus.Created) {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();
    await updateOrderStatus(
      order_no,
      OrderStatus.Paid,
      paid_at,
      paid_email,
      paid_detail
    );

    if (order.user_uuid) {
      if (order.credits > 0) {
        // increase credits for paied order
        await updateCreditForOrder(order as unknown as Order);
      }

      // update affiliate for paied order
      await updateAffiliateForOrder(order as unknown as Order);
    }

    // 发送订单确认邮件（不影响主流程）
    if (paid_email) {
      try {
        await sendOrderConfirmationEmail({
          order: order as unknown as Order,
          customerEmail: paid_email,
        });
      } catch (e) {
        console.log("send order confirmation email failed: ", e);
      }
    }

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email,
      paid_detail
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}

/**
 * 处理 Creem 支付成功回调
 */
export async function handleCreemOrder(data: CreemPaymentData) {
  try {
    // 🔥 添加详细日志：打印收到的所有数据
    console.log("🔔 [handleCreemOrder] ========== 开始处理 Creem 订单 ==========");
    console.log("🔔 [handleCreemOrder] 收到的完整数据:", JSON.stringify(data, null, 2));
    console.log("🔔 [handleCreemOrder] 数据的所有键:", Object.keys(data));
    if (data.metadata) {
      console.log("🔔 [handleCreemOrder] metadata 内容:", JSON.stringify(data.metadata, null, 2));
      console.log("🔔 [handleCreemOrder] metadata 的所有键:", Object.keys(data.metadata));
    }

    // 从多个可能的位置获取订单号
    // Creem 的数据结构可能是：
    // 1. { order_no: "..." } - 顶层
    // 2. { object: { order: { id: "ord_..." } } } - Creem 的订单 ID（需要匹配）
    // 3. { metadata: { order_no: "..." } } - metadata 中
    // 4. { object: { order: { metadata: { order_no: "..." } } } } - 嵌套 metadata
    
    const creemOrderId = (data as any).object?.order?.id || "";
    
    // 🔥 根据 Creem 文档，订单号应该从 request_id 获取
    // 创建 checkout 时传递的 request_id 会在 webhook 中返回
    // 优先级：request_id > metadata.order_no > 其他位置
    let order_no =
      data.request_id || // 🔥 最高优先级：Creem 返回的 request_id（对应我们传递的 request_id）
      (data as any).object?.request_id || // 可能在 object 中
      data.order_no ||
      data.order_id ||
      data.metadata?.order_no || // metadata 中的订单号
      data.metadata?.order_id ||
      (data as any).object?.metadata?.order_no ||
      (data as any).object?.metadata?.order_id ||
      (data as any).object?.order?.metadata?.order_no ||
      (data as any).object?.order?.metadata?.order_id ||
      "";

    console.log("🔔 [handleCreemOrder] 尝试提取订单号:");
    console.log("  - data.request_id (最高优先级):", data.request_id);
    console.log("  - data.object?.request_id:", (data as any).object?.request_id);
    console.log("  - data.order_no:", data.order_no);
    console.log("  - data.metadata?.order_no:", data.metadata?.order_no);
    console.log("  - data.object?.metadata?.order_no:", (data as any).object?.metadata?.order_no);
    console.log("  - data.object?.order?.metadata?.order_no:", (data as any).object?.order?.metadata?.order_no);
    console.log("🔔 [handleCreemOrder] 最终提取的订单号:", order_no || "(未找到)");

    // 🔥 声明 order 变量，用于存储匹配到的订单
    let order: Awaited<ReturnType<typeof findOrderByOrderNo>> | null = null;

    // 如果找不到我们的订单号，尝试通过 Creem 订单 ID 或其他信息匹配
    if (!order_no) {
      console.warn("⚠️ [handleCreemOrder] 无法从标准位置找到订单号，尝试其他方式匹配");
      
      // 🔥 关键修复：先尝试通过 Creem 订单 ID 查找订单
      // 如果之前创建订单时保存了 creem_order_id，可以通过这个 ID 匹配
      if (creemOrderId) {
        console.log("🔔 [handleCreemOrder] 尝试通过 Creem 订单 ID 查找订单:", creemOrderId);
        try {
          // 查找所有状态为 Created 的订单，检查 order_detail 中是否包含 creem_order_id
          // 🔥 使用同步导入，避免 chunk 加载错误
          
          // 查找最近 24 小时内创建的、状态为 Created 的订单
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const allRecentOrders = await db()
            .select()
            .from(orders)
            .where(
              and(
                eq(orders.status, OrderStatus.Created),
                gte(orders.created_at, twentyFourHoursAgo)
              )
            )
            .orderBy(desc(orders.created_at))
            .limit(50); // 限制查询数量
          
          console.log("🔔 [handleCreemOrder] 找到", allRecentOrders.length, "个待支付订单");
          
          // 检查每个订单的 order_detail 中是否包含 creem_order_id
          // 同时，也通过金额和邮箱匹配（如果 order_detail 中有这些信息）
          const webhookAmount = (data as any).object?.order?.amount || data.amount || 0;
          const webhookEmail = (data as any).object?.customer?.email || 
                               (typeof (data as any).object?.customer === 'object' && (data as any).object?.customer?.email) ||
                               data.customer_email || 
                               data.email || 
                               "";
          
          for (const recentOrder of allRecentOrders) {
            if (recentOrder.order_detail) {
              try {
                const orderDetail = JSON.parse(recentOrder.order_detail);
                
                // 方法1：通过 Creem 订单 ID 匹配
                if (
                  orderDetail.creem_order_id === creemOrderId ||
                  (orderDetail.checkout_url && orderDetail.checkout_url.includes(creemOrderId))
                ) {
                  console.log("✅ [handleCreemOrder] 通过 Creem 订单 ID 匹配到订单:", recentOrder.order_no);
                  order_no = recentOrder.order_no;
                  order = recentOrder;
                  break;
                }
                
                // 方法2：通过金额和邮箱匹配（如果 order_detail 中有这些信息）
                if (webhookAmount > 0 && webhookEmail) {
                  const orderAmount = orderDetail.amount || recentOrder.amount;
                  const orderEmail = orderDetail.user_email || recentOrder.user_email;
                  
                  // 金额允许 ±1 的容差
                  if (
                    Math.abs(orderAmount - webhookAmount) <= 1 &&
                    orderEmail && 
                    orderEmail.toLowerCase() === webhookEmail.toLowerCase()
                  ) {
                    console.log("✅ [handleCreemOrder] 通过金额和邮箱匹配到订单:", recentOrder.order_no);
                    order_no = recentOrder.order_no;
                    order = recentOrder;
                    break;
                  }
                }
              } catch (e) {
                // 忽略解析错误
                console.warn("⚠️ [handleCreemOrder] 解析 order_detail 失败:", e);
              }
            }
          }
        } catch (e) {
          console.error("❌ [handleCreemOrder] 通过 Creem 订单 ID 查找失败:", e);
        }
      }
    }
    
    // 如果还是找不到，尝试通过 customer email 和 amount 匹配订单
    if (!order_no) {
        // 🔥 修复：从多个位置提取邮箱
        // 注意：object.customer 可能是 ID 字符串，不是对象
        const customerEmail = 
          (data as any).object?.order?.customer_email ||
          (data as any).object?.customer?.email ||
          (typeof (data as any).object?.customer === 'object' && (data as any).object?.customer?.email) ||
          data.customer_email ||
          data.email ||
          "";
        
        const amount = 
          (data as any).object?.order?.amount ||
          (data as any).object?.order?.amount_paid ||
          data.amount ||
          0;
        
        console.log("🔔 [handleCreemOrder] 尝试通过邮箱和金额匹配订单:");
        console.log("  - 邮箱:", customerEmail);
        console.log("  - 金额:", amount);
        console.log("  - object.customer 类型:", typeof (data as any).object?.customer);
        console.log("  - object.customer 值:", (data as any).object?.customer);
        
        if (customerEmail && amount > 0) {
          // 尝试通过邮箱和金额查找订单
          try {
            // 🔥 使用同步导入，避免 chunk 加载错误
            const matchedOrder = await findOrderByEmailAndAmount(customerEmail, amount);
            if (matchedOrder && matchedOrder.status === OrderStatus.Created) {
              console.log("✅ [handleCreemOrder] 通过邮箱和金额匹配到订单:", matchedOrder.order_no);
              // 使用匹配到的订单号继续处理
              const matchedOrderNo = matchedOrder.order_no;
              // 直接使用匹配到的订单号，跳过订单号检查
              // 继续后续处理流程
              const paid_email = customerEmail;
              const paid_detail = JSON.stringify(data);
              const paid_at = getIsoTimestr();
              
              await updateOrderStatus(
                matchedOrderNo,
                OrderStatus.Paid,
                paid_at,
                paid_email,
                paid_detail
              );

              // 发放积分
              if (matchedOrder.user_uuid) {
                if (matchedOrder.credits > 0) {
                  await updateCreditForOrder(matchedOrder as unknown as Order);
                }
                // 更新推荐人收益
                await updateAffiliateForOrder(matchedOrder as unknown as Order);
              }

              // 发送订单确认邮件
              if (paid_email) {
                try {
                  await sendOrderConfirmationEmail({
                    order: matchedOrder as unknown as Order,
                    customerEmail: paid_email,
                  });
                } catch (e) {
                  console.log("send order confirmation email failed: ", e);
                }
              }

              console.log("✅ [handleCreemOrder] ========== Creem 订单处理成功（通过匹配） ==========");
              console.log("✅ [handleCreemOrder] 订单号:", matchedOrderNo);
              console.log("✅ [handleCreemOrder] 支付时间:", paid_at);
              console.log("✅ [handleCreemOrder] 支付邮箱:", paid_email);
              return;
            } else {
              console.warn("⚠️ [handleCreemOrder] 未找到匹配的订单（邮箱:", customerEmail, "金额:", amount, ")");
            }
          } catch (e) {
            console.error("❌ [handleCreemOrder] 通过邮箱和金额匹配订单失败:", e);
          }
        }
        
        // 如果还是找不到，尝试最后一种方法：查找所有最近的订单，通过金额匹配
        console.warn("⚠️ [handleCreemOrder] 所有匹配方法都失败，尝试最后的方法：查找所有最近订单");
        try {
          // 🔥 使用同步导入，避免 chunk 加载错误
          const webhookAmount = (data as any).object?.order?.amount || data.amount || 0;
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (webhookAmount > 0) {
            const allRecentOrders = await db()
              .select()
              .from(orders)
              .where(
                and(
                  eq(orders.status, OrderStatus.Created),
                  gte(orders.created_at, twentyFourHoursAgo)
                )
              )
              .orderBy(desc(orders.created_at))
              .limit(10);
            
            console.log("🔔 [handleCreemOrder] 找到", allRecentOrders.length, "个待支付订单，尝试通过金额匹配");
            
            // 通过金额匹配（允许 ±1 的容差）
            for (const recentOrder of allRecentOrders) {
              if (Math.abs(recentOrder.amount - webhookAmount) <= 1) {
                console.log("✅ [handleCreemOrder] 通过金额匹配到订单:", recentOrder.order_no);
                order_no = recentOrder.order_no;
                order = recentOrder;
                break;
              }
            }
          }
        } catch (e) {
          console.error("❌ [handleCreemOrder] 最后匹配方法失败:", e);
        }
        
        // 如果还是找不到，抛出错误
        if (!order_no || !order) {
          console.error("❌ [handleCreemOrder] 无法找到订单号！");
          console.error("❌ [handleCreemOrder] 完整数据内容:", JSON.stringify(data, null, 2));
          throw new Error("order_no not found in Creem payment data");
        }
    }

    // 检查支付状态
    // Creem 的支付状态可能在 data.object.order.status
    const paymentStatus = 
      (data as any).object?.order?.status ||
      data.status || 
      data.payment_status || 
      "";
    console.log("🔔 [handleCreemOrder] 支付状态:", paymentStatus);
    if (paymentStatus !== "paid" && paymentStatus !== "succeeded" && paymentStatus !== "completed") {
      console.log("⚠️ [handleCreemOrder] 支付状态不是成功状态，跳过处理:", paymentStatus);
      return; // 不是成功状态，不处理
    }

    // 获取支付邮箱
    // Creem 的邮箱可能在 data.object.order.customer 或 data.object.customer.email
    const paid_email =
      (data as any).object?.order?.customer_email ||
      (data as any).object?.customer?.email ||
      (data as any).object?.customer_email ||
      data.customer_email ||
      data.email ||
      data.metadata?.user_email ||
      "";

    const paid_detail = JSON.stringify(data);

    // 查找订单（如果还没有通过匹配逻辑找到）
    if (!order) {
      console.log("🔔 [handleCreemOrder] 查找订单:", order_no);
      order = await findOrderByOrderNo(order_no);
      if (!order) {
        console.error("❌ [handleCreemOrder] 订单未找到:", order_no);
        throw new Error("invalid order: order not found");
      }
    }
    console.log("✅ [handleCreemOrder] 订单找到:", {
      order_no: order.order_no,
      status: order.status,
      credits: order.credits,
      user_uuid: order.user_uuid,
    });

    // 检查订单状态（防止重复处理）
    if (order.status !== OrderStatus.Created) {
      console.log("⚠️ [handleCreemOrder] 订单已处理，跳过:", order_no, order.status);
      return; // 订单已处理，直接返回
    }

    // 更新订单状态
    const paid_at = getIsoTimestr();
    await updateOrderStatus(
      order_no,
      OrderStatus.Paid,
      paid_at,
      paid_email,
      paid_detail
    );

    // 发放积分
    if (order.user_uuid) {
      if (order.credits > 0) {
        await updateCreditForOrder(order as unknown as Order);
      }

      // 更新推荐人收益
      await updateAffiliateForOrder(order as unknown as Order);
    }

    // 发送订单确认邮件
    if (paid_email) {
      try {
        await sendOrderConfirmationEmail({
          order: order as unknown as Order,
          customerEmail: paid_email,
        });
      } catch (e) {
        console.log("send order confirmation email failed: ", e);
        // 邮件发送失败不影响订单处理
      }
    }

    console.log("✅ [handleCreemOrder] ========== Creem 订单处理成功 ==========");
    console.log("✅ [handleCreemOrder] 订单号:", order_no);
    console.log("✅ [handleCreemOrder] 支付时间:", paid_at);
    console.log("✅ [handleCreemOrder] 支付邮箱:", paid_email);
    console.log("✅ [handleCreemOrder] 积分:", order.credits);
  } catch (e: any) {
    console.error("handle creem order failed: ", e);
    throw e;
  }
}

/**
 * PayPal 支付数据接口
 */
interface PayPalPaymentData {
  id?: string; // Capture 时为 capture ID，Order 时为 order ID
  order_id?: string;
  invoice_id?: string; // 自定义订单号（我们传递的 order_no），Capture 可能带此字段
  custom_id?: string;
  purchase_units?: Array<{
    reference_id?: string;
    invoice_id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payee?: { email_address?: string };
  }>;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  amount?: { value?: string; currency_code?: string }; // Capture 时有顶层 amount
  status?: string;
  payment_status?: string;
  metadata?: {
    order_no?: string;
    user_email?: string;
    user_uuid?: string;
    credits?: string;
  };
  /** PAYMENT.CAPTURE.COMPLETED 的 resource 含此字段，含 PayPal Order ID */
  supplementary_data?: {
    related_ids?: { order_id?: string; authorization_id?: string; capture_id?: string };
  };
  payee?: { email_address?: string; merchant_id?: string };
  [key: string]: any;
}

/**
 * 处理 PayPal 支付成功回调
 * @param data - Webhook resource（Order 或 Capture）
 * @param eventType - 如 PAYMENT.CAPTURE.COMPLETED（resource 为 Capture）、PAYMENT.SALE.COMPLETED 等
 */
export async function handlePayPalOrder(
  data: PayPalPaymentData,
  eventType?: string
) {
  try {
    const isCapture = eventType === "PAYMENT.CAPTURE.COMPLETED";
    console.log("🔔 [handlePayPalOrder] ========== 开始处理 PayPal 订单 ==========");
    console.log("🔔 [handlePayPalOrder] 事件类型:", eventType ?? "(未传)");
    console.log("🔔 [handlePayPalOrder] 是否为 Capture 事件:", isCapture);
    console.log("🔔 [handlePayPalOrder] 收到的完整数据:", JSON.stringify(data, null, 2));
    console.log("🔔 [handlePayPalOrder] 数据的所有键:", Object.keys(data));

    // 订单号：Order 来自 purchase_units / invoice_id 等；Capture 可能只有 invoice_id
    let order_no =
      data.invoice_id ||
      data.custom_id ||
      data.purchase_units?.[0]?.reference_id ||
      data.purchase_units?.[0]?.invoice_id ||
      data.purchase_units?.[0]?.custom_id ||
      data.metadata?.order_no ||
      "";

    // PayPal Order ID：用于匹配 order_detail.paypal_order_id。
    // Capture 时 data.id 是 capture ID，必须用 supplementary_data.related_ids.order_id。
    const paypalOrderId =
      data.supplementary_data?.related_ids?.order_id ||
      data.order_id ||
      (isCapture ? undefined : data.id);

    console.log("🔔 [handlePayPalOrder] 尝试提取订单号:");
    console.log("  - data.invoice_id:", data.invoice_id);
    console.log("  - data.custom_id:", data.custom_id);
    console.log("  - data.purchase_units?.[0]?.reference_id:", data.purchase_units?.[0]?.reference_id);
    console.log("  - data.purchase_units?.[0]?.invoice_id:", data.purchase_units?.[0]?.invoice_id);
    console.log("  - data.purchase_units?.[0]?.custom_id:", data.purchase_units?.[0]?.custom_id);
    console.log("  - data.metadata?.order_no:", data.metadata?.order_no);
    console.log("🔔 [handlePayPalOrder] 最终提取的订单号:", order_no || "(未找到)");
    console.log("🔔 [handlePayPalOrder] PayPal Order ID（用于匹配）:", paypalOrderId || "(未找到)");

    let order: Awaited<ReturnType<typeof findOrderByOrderNo>> | null = null;

    // 🔥 优先通过 PayPal Order ID 匹配（更可靠），即使 order_no 已提取也要先尝试
    if (paypalOrderId) {
      console.log("🔔 [handlePayPalOrder] 优先通过 PayPal 订单 ID 查找订单:", paypalOrderId);
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const allRecentOrders = await db()
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.status, OrderStatus.Created),
              gte(orders.created_at, twentyFourHoursAgo)
            )
          )
          .orderBy(desc(orders.created_at))
          .limit(50);

        console.log("🔔 [handlePayPalOrder] 找到", allRecentOrders.length, "个待支付订单");

        // 金额：Capture 用顶层 amount，Order 用 purchase_units[0].amount
        const webhookAmount =
          parseFloat(data.amount?.value || data.purchase_units?.[0]?.amount?.value || "0") * 100;
        // 邮箱：Capture 无 payer，只有 payee（商户）；Order 有 payer
        const webhookEmail =
          data.payer?.email_address ||
          data.purchase_units?.[0]?.payee?.email_address ||
          "";

        for (const recentOrder of allRecentOrders) {
          if (recentOrder.order_detail) {
            try {
              const orderDetail = JSON.parse(recentOrder.order_detail);

              // 方法1：通过 PayPal 订单 ID 匹配（最可靠）
              if (
                orderDetail.paypal_order_id === paypalOrderId ||
                orderDetail.order_id === paypalOrderId
              ) {
                console.log("✅ [handlePayPalOrder] 通过 PayPal 订单 ID 匹配到订单:", recentOrder.order_no);
                order_no = recentOrder.order_no; // 使用匹配到的真实 order_no
                order = recentOrder;
                break;
              }

              // 方法2：通过金额和邮箱匹配（Capture 通常无 payer 邮箱，可能跳过）
              if (webhookAmount > 0 && webhookEmail) {
                const orderAmount = orderDetail.amount || recentOrder.amount;
                const orderEmail = orderDetail.user_email || recentOrder.user_email;

                // 金额允许 ±1 的容差
                if (
                  Math.abs(orderAmount - webhookAmount) <= 1 &&
                  orderEmail &&
                  orderEmail.toLowerCase() === webhookEmail.toLowerCase()
                ) {
                  console.log("✅ [handlePayPalOrder] 通过金额和邮箱匹配到订单:", recentOrder.order_no);
                  order_no = recentOrder.order_no;
                  order = recentOrder;
                  break;
                }
              }
            } catch (e) {
              console.warn("⚠️ [handlePayPalOrder] 解析 order_detail 失败:", e);
            }
          }
        }
      } catch (e) {
        console.error("❌ [handlePayPalOrder] 通过 PayPal 订单 ID 查找失败:", e);
      }
    }

    // 如果还是找不到，尝试通过邮箱和金额匹配（Capture 无 payer 邮箱，通常跳过）
    if (!order_no && !order) {
      const customerEmail =
        data.payer?.email_address ||
        data.purchase_units?.[0]?.payee?.email_address ||
        "";
      const amount =
        parseFloat(data.amount?.value || data.purchase_units?.[0]?.amount?.value || "0") * 100;

      console.log("🔔 [handlePayPalOrder] 尝试通过邮箱和金额匹配订单:");
      console.log("  - 邮箱:", customerEmail);
      console.log("  - 金额:", amount);

      if (customerEmail && amount > 0) {
        try {
          const matchedOrder = await findOrderByEmailAndAmount(customerEmail, amount);
          if (matchedOrder && matchedOrder.status === OrderStatus.Created) {
            console.log("✅ [handlePayPalOrder] 通过邮箱和金额匹配到订单:", matchedOrder.order_no);
            order_no = matchedOrder.order_no;
            order = matchedOrder;
          } else {
            console.warn("⚠️ [handlePayPalOrder] 未找到匹配的订单（邮箱:", customerEmail, "金额:", amount, ")");
          }
        } catch (e) {
          console.error("❌ [handlePayPalOrder] 通过邮箱和金额匹配订单失败:", e);
        }
      }
    }

    // 如果还是找不到，抛出错误
    if (!order_no) {
      console.error("❌ [handlePayPalOrder] 无法找到订单号！");
      console.error("❌ [handlePayPalOrder] 完整数据内容:", JSON.stringify(data, null, 2));
      throw new Error("order_no not found in PayPal payment data");
    }

    // 检查支付状态
    const paymentStatus = data.status || data.payment_status || "";
    console.log("🔔 [handlePayPalOrder] 支付状态:", paymentStatus);
    if (
      paymentStatus !== "COMPLETED" &&
      paymentStatus !== "APPROVED" &&
      paymentStatus !== "CAPTURED"
    ) {
      console.log("⚠️ [handlePayPalOrder] 支付状态不是成功状态，跳过处理:", paymentStatus);
      return; // 不是成功状态，不处理
    }

    // 获取支付邮箱（payer 为买家；Capture 无 payer，稍后用订单 user_email 回退）
    let paid_email =
      data.payer?.email_address ||
      data.metadata?.user_email ||
      "";

    const paid_detail = JSON.stringify(data);

    // 查找订单（如果还没有通过匹配逻辑找到）
    if (!order) {
      console.log("🔔 [handlePayPalOrder] 查找订单:", order_no);
      order = await findOrderByOrderNo(order_no);
      if (!order) {
        console.error("❌ [handlePayPalOrder] 订单未找到:", order_no);
        throw new Error("invalid order: order not found");
      }
    }
    if (!paid_email && order.user_email) paid_email = order.user_email;

    console.log("✅ [handlePayPalOrder] 订单找到:", {
      order_no: order.order_no,
      status: order.status,
      credits: order.credits,
      user_uuid: order.user_uuid,
    });

    // 检查订单状态（防止重复处理）
    if (order.status !== OrderStatus.Created) {
      console.log("⚠️ [handlePayPalOrder] 订单已处理，跳过:", order_no, order.status);
      return; // 订单已处理，直接返回
    }

    // 更新订单状态
    const paid_at = getIsoTimestr();
    await updateOrderStatus(
      order_no,
      OrderStatus.Paid,
      paid_at,
      paid_email,
      paid_detail
    );

    // 发放积分
    if (order.user_uuid) {
      if (order.credits > 0) {
        await updateCreditForOrder(order as unknown as Order);
      }

      // 更新推荐人收益
      await updateAffiliateForOrder(order as unknown as Order);
    }

    // 发送订单确认邮件
    if (paid_email) {
      try {
        await sendOrderConfirmationEmail({
          order: order as unknown as Order,
          customerEmail: paid_email,
        });
      } catch (e) {
        console.log("send order confirmation email failed: ", e);
        // 邮件发送失败不影响订单处理
      }
    }

    console.log("✅ [handlePayPalOrder] ========== PayPal 订单处理成功 ==========");
    console.log("✅ [handlePayPalOrder] 订单号:", order_no);
    console.log("✅ [handlePayPalOrder] 支付时间:", paid_at);
    console.log("✅ [handlePayPalOrder] 支付邮箱:", paid_email);
    console.log("✅ [handlePayPalOrder] 积分:", order.credits);
  } catch (e: any) {
    console.error("handle paypal order failed: ", e);
    throw e;
  }
}
