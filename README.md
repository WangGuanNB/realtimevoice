# 🔥 ShipFire

<div align="center">

> **The Ultimate Next.js 15 SaaS Starter Kit with AI Integration**  
> Ship your SaaS product faster with production-ready features

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Features

- ⚡ **Next.js 15** - App Router, React 19, TypeScript
- 🎨 **Modern UI** - Tailwind CSS + Shadcn UI, Dark/Light theme
- 🔐 **Auth** - NextAuth.js v5, Google One Tap
- 💳 **Payments** - Stripe & Creem integration, subscriptions
- 🤖 **AI Ready** - OpenAI, Google AI, Kling AI integrations
- 📊 **Admin Dashboard** - User, order, content management
- 🌍 **i18n** - Multi-language support (next-intl)
- 🎁 **Credit System** - Configurable credits & referral program

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended)

### Installation

```bash
# Clone and install
git clone https://github.com/WangGuanNB/shipfire.git
cd shipfire
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your config

# Initialize database
pnpm db:push

# Start dev server
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## 🔧 Environment Configuration

Create `.env.local` with the following variables:

### Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shipfire

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ========== 支付方式开关配置 ==========
# 系统会根据配置自动选择支付方式（优先级：Stripe > PayPal > Creem）
# 至少需要启用一个支付方式

# Stripe 支付配置
NEXT_PUBLIC_PAYMENT_STRIPE_ENABLED=true  # 是否启用 Stripe 支付
STRIPE_PRIVATE_KEY=sk_test_...  # Stripe 私钥（后端使用）
STRIPE_PUBLIC_KEY=pk_test_...  # Stripe 公钥（前端使用）
STRIPE_WEBHOOK_SECRET=whsec_...  # Stripe Webhook 密钥

# PayPal 支付配置
NEXT_PUBLIC_PAYMENT_PAYPAL_ENABLED=true  # 是否启用 PayPal 支付
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=sandbox  # sandbox | live
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id  # Optional, for webhook verification

# Creem 支付配置
NEXT_PUBLIC_PAYMENT_CREEM_ENABLED=false  # 是否启用 Creem 支付
CREEM_API_KEY=your-creem-api-key
CREEM_TEST_MODE=true  # Set to false for production
NEXT_PUBLIC_CREEM_PRODUCT_ID=your-product-id

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Optional

```env
# AI Services
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=your-google-ai-key
KLING_AI_API_KEY=your-kling-ai-key

# Credit System Configuration
NEW_USER_CREDITS=1000        # Credits for new users (default: 1000)
AI_CHAT_CREDIT_COST=10       # Credits per AI chat (default: 10)

# App URLs
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
NEXT_PUBLIC_PAY_CANCEL_URL=/pricing
```

### Payment Setup

**Stripe:**
1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Set up webhook endpoint: `https://yourdomain.com/api/stripe-notify`
3. Add webhook secret to `STRIPE_WEBHOOK_SECRET`

**Creem:**
1. Get API key from [Creem Dashboard](https://www.creem.io)
2. Create products and get product IDs
3. Configure webhook: `https://yourdomain.com/api/checkout/creem/webhook`
4. Set `CREEM_TEST_MODE=true` for testing

**PayPal:**
1. Get API credentials from [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Create a REST API app to get Client ID and Secret
3. Set `PAYPAL_ENVIRONMENT=sandbox` for testing (use `live` for production)
4. Configure webhook endpoint: `https://yourdomain.com/api/paypal-notify`
5. Add webhook ID to `PAYPAL_WEBHOOK_ID` (optional, for webhook verification)

---

## 💳 Payment Integration

ShipFire supports **Stripe**, **Creem**, and **PayPal** payment gateways.

### Using Stripe

```typescript
import { usePayment } from '@/hooks/usePayment';

const { handleCheckout, isLoading } = usePayment();

await handleCheckout(pricingItem, false, 'stripe');
```

### Using Creem

```typescript
import { usePayment } from '@/hooks/usePayment';

const { handleCheckout, isLoading } = usePayment();

await handleCheckout(pricingItem, false, 'creem');
```

### Using PayPal

```typescript
import { usePayment } from '@/hooks/usePayment';

const { handleCheckout, isLoading } = usePayment();

await handleCheckout(pricingItem, false, 'paypal');
```

### Credit System

Configure credit amounts via environment variables:

- `NEW_USER_CREDITS` - Credits granted to new users (default: 1000)
- `AI_CHAT_CREDIT_COST` - Credits consumed per AI chat (default: 10)

Credits are automatically granted on:
- User registration
- Successful payment
- Referral rewards

---

## 📦 Tech Stack

| Category | Technologies |
|:---:|:---|
| **Framework** | Next.js 15 • React 19 • TypeScript |
| **Styling** | Tailwind CSS • Shadcn UI • Radix UI |
| **Database** | PostgreSQL • Drizzle ORM |
| **Auth** | NextAuth.js v5 • Google One Tap |
| **Payments** | Stripe • Creem |
| **AI** | OpenAI DALL-E • Google Imagen • Kling AI |
| **i18n** | next-intl |
| **Deploy** | Vercel • Docker |

---

## 🗂️ Project Structure

```
shipfire/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── [locale]/          # Internationalized pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── blocks/           # Page blocks
├── services/            # Business logic
│   ├── config.ts        # System configuration
│   ├── creem.ts        # Creem payment service
│   ├── email.ts        # Email service (Resend)
│   └── order.ts        # Order processing
├── hooks/              # React hooks
│   └── usePayment.ts   # Payment hook
├── models/             # Database models
└── types/              # TypeScript definitions
```

---

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/WangGuanNB/shipfire)

```bash
vercel --prod
```

### Docker

```bash
pnpm docker:build
docker run -p 3000:3000 shipfire:latest
```

---

## 📖 Documentation

Full documentation: [shipfire.cn/docs](https://shipfire.cn/docs)

---

## 🌟 Built with ShipFire

<table>
<tr>
<td align="center">
<a href="https://circle-fifths.com" target="_blank">
<strong>Circle of Fifths</strong><br/>
<sub>Music theory platform</sub>
</a>
</td>
<td align="center">
<a href="https://graffiti-generator.org" target="_blank">
<strong>Graffiti Generator</strong><br/>
<sub>AI street art tool</sub>
</a>
</td>
<td align="center">
<a href="https://astrocarto.org/" target="_blank">
  <a href="https://paper-banana.app" target="_blank">
    <a href="https://fireredimage.org" target="_blank">
<strong>AstroCarto</strong><br/>
<sub>Astrology mapping</sub>
</a>
</td>
</tr>
</table>

[Share your project →](https://github.com/WangGuanNB/shipfire/issues)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

<div align="center">

**🔥 Ship your SaaS faster with ShipFire!**

[⭐ Star on GitHub](https://github.com/WangGuanNB/shipfire) • [📖 Documentation](https://shipfire.cn/docs)

Made with ❤️ by developers, for developers

</div>
