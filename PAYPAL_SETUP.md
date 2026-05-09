# PayPal 支付集成配置指南

## 📋 概述

本文档说明如何在 ShipFire 项目中配置和使用 PayPal 支付功能。

## 🔧 环境变量配置

在 `.env.local` 文件中添加以下配置：

```env
# PayPal 支付配置
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=sandbox  # sandbox | live
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id  # 可选，用于 webhook 签名验证
```

### 配置说明

- **PAYPAL_CLIENT_ID**: PayPal 应用的 Client ID（从 PayPal Developer Dashboard 获取）
- **PAYPAL_CLIENT_SECRET**: PayPal 应用的 Client Secret（从 PayPal Developer Dashboard 获取）
- **PAYPAL_ENVIRONMENT**: 
  - `sandbox`: 测试环境（开发时使用）
  - `live`: 生产环境（正式上线时使用）
- **PAYPAL_WEBHOOK_ID**: Webhook ID（可选，用于验证 webhook 签名）

## 🚀 获取 PayPal API 凭证

### 步骤 1: 访问 PayPal Developer Dashboard

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. 使用你的 PayPal 账号登录

### 步骤 2: 创建应用

1. 点击 "Create App" 或 "创建应用"
2. 填写应用信息：
   - **App Name**: 你的应用名称（例如：ShipFire）
   - **Merchant**: 选择你的商家账号
3. 选择环境：
   - **Sandbox**: 用于测试
   - **Live**: 用于生产环境

### 步骤 3: 获取凭证

创建应用后，你会看到：
- **Client ID**: 复制到 `PAYPAL_CLIENT_ID`
- **Secret**: 点击 "Show" 显示，复制到 `PAYPAL_CLIENT_SECRET`

## 🔗 配置 Webhook

### 步骤 1: 创建 Webhook

1. 在 PayPal Developer Dashboard 中，进入你的应用
2. 找到 "Webhooks" 部分
3. 点击 "Add Webhook" 或 "添加 Webhook"
4. 填写信息：
   - **Webhook URL**: `https://yourdomain.com/api/paypal-notify/`  
     **注意**：项目启用了 `trailingSlash: true`，URL 必须带尾部斜杠，否则会 308 重定向，PayPal 不跟随导致回调失败。
   - **Event types**: 选择以下事件：
     - `PAYMENT.CAPTURE.COMPLETED`
     - `CHECKOUT.ORDER.APPROVED`
     - `PAYMENT.SALE.COMPLETED`

### 步骤 2: 获取 Webhook ID

创建 Webhook 后，你会看到一个 Webhook ID，复制到 `PAYPAL_WEBHOOK_ID`（可选）

## 💻 代码使用

### 前端使用

```typescript
import { usePayment } from '@/hooks/usePayment';

const { handleCheckout, isLoading } = usePayment();

// 使用 PayPal 支付
await handleCheckout(pricingItem, false, 'paypal');
```

### API 端点

- **创建支付订单**: `POST /api/checkout/paypal`
- **Webhook 回调**: `POST /api/paypal-notify`

## 📝 支付流程

1. 用户点击支付按钮，调用 `handleCheckout(item, false, 'paypal')`
2. 前端调用 `/api/checkout/paypal` 创建订单
3. 后端创建本地订单并调用 PayPal API 创建支付订单
4. 返回 `approval_url`，前端跳转到 PayPal 支付页面
5. 用户在 PayPal 完成支付
6. PayPal 重定向回 `success_url`（`/pay-success/paypal?order_no=xxx`）
7. PayPal 发送 Webhook 到 `/api/paypal-notify`
8. 后端处理 Webhook，更新订单状态，发放积分

## 🔍 测试

### 使用 PayPal 沙箱环境

1. 设置 `PAYPAL_ENVIRONMENT=sandbox`
2. 使用 PayPal 沙箱测试账号进行支付
3. 在 PayPal Developer Dashboard 中查看交易记录

### 测试账号

PayPal 沙箱环境提供测试账号：
- **Buyer Account**: 用于测试买家支付流程
- **Seller Account**: 用于测试商家收款流程

## ⚠️ 注意事项

1. **金额单位**: PayPal 使用元（两位小数），代码会自动将分转换为元
2. **订单号匹配**: 系统通过 `invoice_id`、`custom_id` 或 `reference_id` 匹配订单
3. **Webhook 验证**: 生产环境建议启用 Webhook 签名验证
4. **环境切换**: 测试完成后，记得将 `PAYPAL_ENVIRONMENT` 改为 `live`

## 📚 相关文档

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)

## 🐛 故障排除

### 问题 1: 无法创建订单

- 检查 `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET` 是否正确
- 确认 `PAYPAL_ENVIRONMENT` 设置正确
- 查看服务器日志获取详细错误信息

### 问题 2: Webhook 未收到

- **Webhook URL 必须带尾部斜杠**：`https://yourdomain.com/api/paypal-notify/`（项目 `trailingSlash: true`，无斜杠会 308 重定向，PayPal 不跟随）
- 确认 Webhook URL 配置正确
- 检查服务器是否可以从公网访问
- 查看 PayPal Dashboard 中的 Webhook 事件日志

### 问题 3: 订单匹配失败

- 检查订单号是否正确传递到 PayPal
- 查看 `order_detail` 字段中的 PayPal 订单信息
- 检查日志中的订单匹配逻辑
