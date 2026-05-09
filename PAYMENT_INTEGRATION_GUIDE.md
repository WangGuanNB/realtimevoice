# 多支付平台集成开发文档

## 架构概览

支持 Stripe、PayPal、Creem 三种支付方式，通过统一的 `/api/checkout` 接口自动选择或手动指定支付方式。

## 核心文件结构

```
src/
├── app/api/
│   ├── checkout/route.ts              # 统一支付入口
│   ├── stripe-notify/route.ts         # Stripe webhook
│   ├── paypal-notify/route.ts         # PayPal webhook
│   └── [locale]/pay-success/
│       ├── [session_id]/page.tsx      # Stripe 成功页
│       ├── paypal/page.tsx            # PayPal 成功页（含 capture）
│       └── creem/page.tsx             # Creem 成功页
├── services/
│   ├── payment-selector.ts            # 支付方式选择器
│   ├── paypal.ts                      # PayPal API 封装
│   ├── creem.ts                       # Creem API 封装
│   └── order.ts                       # 订单处理逻辑
├── models/
│   └── order.ts                       # 订单数据库操作
└── db/
    └── schema.ts                      # 数据库表定义
```

## 数据库 Schema

```typescript
export const orders = pgTable("orders_shipfire", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  user_uuid: varchar({ length: 255 }).notNull(),
  user_email: varchar({ length: 255 }).notNull(),
  amount: integer().notNull(),                    // 金额（分）
  currency: varchar({ length: 50 }),              // 货币
  status: varchar({ length: 50 }).notNull(),      // created/paid/failed
  stripe_session_id: varchar({ length: 255 }),    // 存储各平台的订单ID
  credits: integer().notNull(),                   // 积分数量
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  interval: varchar({ length: 50 }),              // one-time/month/year
  valid_months: integer(),
  pay_type: varchar({ length: 50 }),              // stripe/paypal/creem
  created_at: timestamp({ withTimezone: true }),
  paid_at: timestamp({ withTimezone: true }),
  order_detail: text(),                           // JSON 存储详细信息
  // ... 其他字段
});
```

## 支付流程

### 1. 统一支付入口 (`/api/checkout`)

```typescript
// 请求参数
{
  credits: number,
  currency: string,
  amount: number,              // 金额（分）
  interval: string,            // one-time/month/year
  product_id: string,
  product_name: string,
  valid_months: number,
  locale: string,
  payment_method?: string,     // 可选：stripe/paypal/creem
  cancel_url?: string
}

// 响应
{
  payment_method: "stripe" | "paypal" | "creem",
  order_no: string,

  // Stripe
  session_id?: string,
  public_key?: string,

  // PayPal
  approval_url?: string,
  order_id?: string,

  // Creem
  checkout_url?: string
}
```

### 2. 支付方式选择逻辑 (`services/payment-selector.ts`)

```typescript
export function selectPaymentMethod(): string | null {
  // 优先级：Stripe > PayPal > Creem
  if (process.env.STRIPE_PRIVATE_KEY) return "stripe";
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) return "paypal";
  if (process.env.CREEM_API_KEY || process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID) return "creem";
  return null;
}
```

### 3. 订单创建流程

```typescript
// 1. 验证参数（价格、产品ID等）
// 2. 创建订单记录（状态：created）
const order = {
  order_no: getSnowId(),
  status: "created",
  pay_type: paymentMethod,
  // ...
};
await insertOrder(order);

// 3. 调用对应支付平台 API
switch (paymentMethod) {
  case "stripe": return handleStripeCheckout();
  case "paypal": return handlePayPalCheckout();
  case "creem": return handleCreemCheckout();
}
```

## Stripe 集成

### 创建支付会话

```typescript
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [{
    price_data: {
      currency: currency,
      product_data: { name: product_name },
      unit_amount: amount,
      recurring: is_subscription ? { interval } : undefined,
    },
    quantity: 1,
  }],
  mode: is_subscription ? "subscription" : "payment",
  success_url: `${baseUrl}/${locale}/pay-success/{CHECKOUT_SESSION_ID}`,
  cancel_url: cancel_url,
  metadata: { order_no, user_email, credits, user_uuid },
});

await updateOrderSession(order_no, session.id, JSON.stringify(session));
```

### Webhook 处理 (`/api/stripe-notify`)

```typescript
// 1. 验证签名
const sig = req.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

// 2. 处理事件
switch (event.type) {
  case "checkout.session.completed":
  case "payment_intent.succeeded":
    await handleStripeOrder(event.data.object);
    break;
}

// 3. 更新订单状态
async function handleStripeOrder(session) {
  const order_no = session.metadata.order_no;
  await updateOrderStatus(order_no, "paid");
  await addUserCredits(user_uuid, credits);
}
```

## PayPal 集成

### 创建订单

```typescript
export async function createPayPalOrder(params) {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: (amount / 100).toFixed(2),
        },
        description: product_name,
        custom_id: order_no,
      }],
      application_context: {
        return_url: success_url,
        cancel_url: cancel_url,
      },
    }),
  });

  const data = await res.json();
  const approval_url = data.links.find(l => l.rel === "approve").href;

  return { order_id: data.id, approval_url };
}
```

### 关键：Capture 支付 (`/pay-success/paypal/page.tsx`)

```typescript
// ⚠️ 重要：PayPal 必须在支付成功页面调用 capture
const order = await findOrderByOrderNo(order_no);

if (order.status === OrderStatus.Created) {
  const paypalOrderId = order.stripe_session_id;

  try {
    await capturePayPalOrder(paypalOrderId);
    // capture 成功后，PayPal 会发送 webhook
  } catch (error) {
    console.error("Capture failed:", error);
  }
}
```

### Capture API

```typescript
export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  return await res.json();
}
```

### Webhook 处理 (`/api/paypal-notify`)

```typescript
// 1. 验证签名（可选，开发环境可跳过）
const isValid = await verifyPayPalWebhookSignature(body, headers, webhookId);

// 2. 解析事件
const eventData = JSON.parse(body);
const { type, data } = parsePayPalWebhookEvent(eventData);

// 3. 处理 PAYMENT.CAPTURE.COMPLETED 事件
switch (type) {
  case "PAYMENT.CAPTURE.COMPLETED":
  case "PAYMENT.SALE.COMPLETED":
    await handlePayPalOrder(data, type);
    break;
}

// 4. 更新订单
async function handlePayPalOrder(data, type) {
  const order_id = data.supplementary_data?.related_ids?.order_id;
  const order = await findOrderBySessionId(order_id);
  await updateOrderStatus(order.order_no, "paid");
  await addUserCredits(order.user_uuid, order.credits);
}
```

## Creem 集成

### 创建支付会话

```typescript
export async function createCreemCheckoutSession(params) {
  const res = await fetch("https://api.creem.io/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CREEM_API_KEY}`,
    },
    body: JSON.stringify({
      product_id: params.product_id,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      metadata: {
        order_no: params.order_no,
        user_email: params.user_email,
        credits: params.credits,
      },
    }),
  });

  const data = await res.json();
  return {
    checkout_url: data.url,
    session_id: data.id,
  };
}
```

### Webhook 处理（类似 Stripe）

Creem 的 webhook 处理逻辑与 Stripe 类似，监听支付成功事件并更新订单状态。

## 环境变量配置

```bash
# Stripe
STRIPE_PRIVATE_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx
PAYPAL_MODE=sandbox  # 或 production

# Creem
CREEM_API_KEY=xxx
NEXT_PUBLIC_CREEM_PRODUCT_ID=xxx
CREEM_WEBHOOK_SECRET=xxx

# 通用
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
NEXT_PUBLIC_PAY_SUCCESS_URL=/pricing
NEXT_PUBLIC_PAY_CANCEL_URL=/pricing
```

## 关键注意事项

### 1. PayPal 必须调用 Capture
- PayPal 创建订单后，用户支付只是"授权"
- **必须在支付成功页面调用 `capturePayPalOrder`**
- 只有 capture 成功后，PayPal 才会发送 `PAYMENT.CAPTURE.COMPLETED` webhook

### 2. Webhook 配置
- Stripe: Dashboard → Webhooks → 添加端点 `https://yourdomain.com/api/stripe-notify`
- PayPal: Developer Dashboard → Webhooks → 订阅 `PAYMENT.CAPTURE.COMPLETED`
- Creem: 在 API 设置中配置 webhook URL

### 3. 金额单位
- Stripe: 分（cents）
- PayPal: 元（dollars），需要除以 100
- Creem: 分（cents）

### 4. 订单状态流转
```
created → (支付成功) → paid
created → (支付失败) → failed
```

### 5. 测试环境
- Stripe: 使用 `sk_test_` 开头的密钥
- PayPal: 设置 `PAYPAL_MODE=sandbox`
- Creem: 使用测试 API Key

## 前端集成示例

```typescript
// 发起支付
const response = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    credits: 100,
    currency: "usd",
    amount: 999,  // $9.99
    interval: "one-time",
    product_id: "standard",
    product_name: "Standard Plan",
    valid_months: 1,
    locale: "en",
    payment_method: "paypal",  // 可选
  }),
});

const data = await response.json();

// 根据支付方式跳转
switch (data.payment_method) {
  case "stripe":
    // 使用 Stripe.js 跳转
    const stripe = await loadStripe(data.public_key);
    await stripe.redirectToCheckout({ sessionId: data.session_id });
    break;

  case "paypal":
    // 直接跳转到 PayPal
    window.location.href = data.approval_url;
    break;

  case "creem":
    // 直接跳转到 Creem
    window.location.href = data.checkout_url;
    break;
}
```

## 迁移步骤（从单一支付到多支付）

1. **添加数据库字段**
```sql
ALTER TABLE orders ADD COLUMN pay_type VARCHAR(50);
```

2. **创建支付选择器** (`services/payment-selector.ts`)

3. **重构 checkout API**
   - 提取 `validateAndCreateOrder` 公共逻辑
   - 创建 `handleStripeCheckout`、`handlePayPalCheckout`、`handleCreemCheckout`
   - 根据 `payment_method` 参数或自动选择

4. **实现各平台 webhook 处理器**
   - `/api/stripe-notify/route.ts`
   - `/api/paypal-notify/route.ts`

5. **创建支付成功页面**
   - Stripe: `/pay-success/[session_id]/page.tsx`
   - PayPal: `/pay-success/paypal/page.tsx` （含 capture）
   - Creem: `/pay-success/creem/page.tsx`

6. **配置环境变量和 webhook**

7. **测试各支付方式**

## 常见问题

### Q: PayPal webhook 不触发？
A: 检查是否在支付成功页面调用了 `capturePayPalOrder`

### Q: 如何支持订阅？
A: 设置 `interval: "month"` 或 `"year"`，Stripe 和 PayPal 都支持

### Q: 如何处理退款？
A: 调用各平台的退款 API，并更新订单状态为 `refunded`

### Q: 如何测试 webhook？
A: 使用各平台的 webhook 模拟器或 ngrok 暴露本地服务
