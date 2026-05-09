# PayPal Webhook 本地开发配置指南

## 🔴 问题诊断

根据你的情况：
- ✅ 支付成功，用户重定向回应用
- ❌ PayPal Dashboard 没有 Webhook 事件记录
- ❌ 系统订单状态未更新

**根本原因：PayPal 无法访问你的 Webhook URL**

## 📋 必须完成的配置步骤

### 步骤 1: 在 PayPal Dashboard 配置 Webhook URL

1. **访问 PayPal Developer Dashboard**
   - 沙盒环境：https://developer.paypal.com/dashboard/webhooks/sandbox
   - 生产环境：https://developer.paypal.com/dashboard/webhooks/live

2. **选择你的应用**
   - Application: `shipFire`（或你的应用名称）

3. **添加或编辑 Webhook**
   - 点击 "Add Webhook" 或编辑现有 Webhook
   - **Webhook URL**: `https://fast3d.online/api/paypal-notify/`（必须带尾部斜杠，否则 308 重定向导致 PayPal 回调失败）
   - **Event types**: 选择以下事件（必须）：
     - ✅ `PAYMENT.CAPTURE.COMPLETED` （最重要）
     - ✅ `PAYMENT.SALE.COMPLETED`
     - ⚠️ `CHECKOUT.ORDER.APPROVED`（可选，已改为不标记为已支付）

4. **保存并获取 Webhook ID**
   - 保存后，复制 Webhook ID 到 `.env.local` 的 `PAYPAL_WEBHOOK_ID`

### 步骤 2: 验证 Webhook URL 可访问性

PayPal 需要能够访问你的 Webhook URL。检查以下：

#### 2.1 测试 Webhook 端点是否可访问

在浏览器或使用 curl 测试：

```bash
curl -X POST https://fast3d.online/api/paypal-notify \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'
```

**预期结果：**
- ✅ 返回 200 状态码（即使报错也说明端点可访问）
- ❌ 如果超时或连接失败，说明 PayPal 无法访问

#### 2.2 检查 SSL 证书

PayPal 要求 HTTPS：
- ✅ 确保 `https://fast3d.online` 有有效的 SSL 证书
- ✅ 证书不能是自签名证书
- ✅ 证书必须由受信任的 CA 签发

#### 2.3 检查防火墙和网络

- ✅ 确保端口 443（HTTPS）开放
- ✅ 确保没有防火墙阻止 PayPal IP
- ✅ 如果使用内网穿透（如 ngrok），确保 URL 正确

### 步骤 3: 使用 PayPal Webhook 模拟器测试

PayPal 提供 Webhook 模拟器，可以手动触发测试事件：

1. **访问 Webhook 模拟器**
   - https://developer.paypal.com/dashboard/webhooks/sandbox
   - 找到你的 Webhook，点击 "Send test event"

2. **选择事件类型**
   - 选择 `PAYMENT.CAPTURE.COMPLETED`

3. **发送测试事件**
   - PayPal 会向你的 Webhook URL 发送测试请求
   - 查看你的服务器日志，应该能看到 POST 请求到 `/api/paypal-notify`

4. **检查日志**
   ```bash
   # 在你的 Next.js 服务器日志中应该看到：
   🔔 [PayPal Webhook] 收到事件: PAYMENT.CAPTURE.COMPLETED
   ```

## 🧪 本地开发调试方法

### 方法 1: 使用 ngrok（推荐）

如果你使用本地开发服务器，需要将本地端口映射到公网：

```bash
# 1. 安装 ngrok
# macOS: brew install ngrok
# 或下载: https://ngrok.com/download

# 2. 启动你的 Next.js 服务器
pnpm dev  # 通常在 localhost:3000

# 3. 在另一个终端启动 ngrok
ngrok http 3000

# 4. 复制 ngrok 提供的 HTTPS URL，例如：
# https://abc123.ngrok.io

# 5. 在 PayPal Dashboard 配置 Webhook URL:
# https://abc123.ngrok.io/api/paypal-notify/

# 6. 更新 .env.local 中的 NEXT_PUBLIC_WEB_URL（如果需要）
NEXT_PUBLIC_WEB_URL=https://abc123.ngrok.io
```

**注意：**
- ngrok 免费版每次重启 URL 会变化
- 需要重新在 PayPal Dashboard 更新 Webhook URL
- ngrok 付费版可以固定域名

### 方法 2: 使用其他内网穿透工具

- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **localtunnel**: `npx localtunnel --port 3000`
- **serveo**: `ssh -R 80:localhost:3000 serveo.net`

### 方法 3: 直接使用生产环境测试

如果你的 `https://fast3d.online` 已经部署：
- 确保生产环境代码已更新（包含我们的修复）
- 在 PayPal Dashboard 配置 Webhook URL 为生产地址
- 进行测试支付

## 🔍 调试检查清单

完成以下检查：

- [ ] PayPal Dashboard 中已配置 Webhook URL: `https://fast3d.online/api/paypal-notify/`（带尾部斜杠）
- [ ] Webhook 订阅了 `PAYMENT.CAPTURE.COMPLETED` 事件
- [ ] Webhook URL 可以通过 curl 访问（返回 200）
- [ ] SSL 证书有效且受信任
- [ ] `.env.local` 中 `PAYPAL_WEBHOOK_ID` 已配置
- [ ] `.env.local` 中 `NEXT_PUBLIC_WEB_URL=https://fast3d.online`
- [ ] 服务器已重启，代码更新生效
- [ ] 使用 PayPal Webhook 模拟器发送测试事件，服务器日志有响应

## 📊 验证 Webhook 是否工作

### 1. 查看 PayPal Dashboard Webhook 事件

访问：https://developer.paypal.com/dashboard/webhooks/sandbox

- 选择你的应用
- 查看 "Webhook Events" 列表
- 应该能看到 `PAYMENT.CAPTURE.COMPLETED` 事件
- 点击事件查看详情，检查 "Status" 是否为 "Success"

### 2. 查看服务器日志

支付成功后，查看 Next.js 服务器日志，应该看到：

```
🔔 [PayPal Webhook] 收到事件: PAYMENT.CAPTURE.COMPLETED
🔔 [PayPal Webhook] 事件数据: {...}
🔔 [handlePayPalOrder] ========== 开始处理 PayPal 订单 ==========
✅ [handlePayPalOrder] ========== PayPal 订单处理成功 ==========
```

### 3. 检查数据库订单状态

支付成功后，订单状态应该从 `Created` 变为 `Paid`。

## ⚠️ 常见问题

### Q1: PayPal Dashboard 显示 "Webhook delivery failed"

**原因：**
- Webhook URL 无法访问
- SSL 证书无效
- 服务器返回非 200 状态码

**解决：**
- 使用 curl 测试 URL 可访问性
- 检查 SSL 证书
- 查看服务器错误日志

### Q2: Webhook 收到了但订单未更新

**原因：**
- 订单匹配逻辑失败
- 支付状态检查失败

**解决：**
- 查看服务器日志中的错误信息
- 检查 `handlePayPalOrder` 函数的日志输出
- 确认订单号匹配逻辑

### Q3: 本地开发无法接收 Webhook

**原因：**
- 本地服务器无法从公网访问
- PayPal Dashboard 配置的 URL 指向 localhost

**解决：**
- 使用 ngrok 或其他内网穿透工具
- 或直接在生产环境测试

## 📝 下一步

1. **立即执行：**
   - 在 PayPal Dashboard 配置 Webhook URL
   - 使用 Webhook 模拟器发送测试事件
   - 检查服务器日志

2. **如果仍然失败：**
   - 检查 `https://fast3d.online/api/paypal-notify` 是否可访问
   - 查看 PayPal Dashboard 中 Webhook 事件的错误详情
   - 检查服务器防火墙和网络配置

3. **成功后：**
   - 进行真实支付测试
   - 验证订单状态更新
   - 验证积分发放
