#!/bin/bash

# PayPal Webhook 端点测试脚本
# 用于验证 Webhook URL 是否可以被 PayPal 访问

WEBHOOK_URL="${1:-https://fast3d.online/api/paypal-notify}"

echo "🔍 测试 PayPal Webhook 端点: $WEBHOOK_URL"
echo ""

# 测试 1: 基本连接测试
echo "📡 测试 1: 基本连接测试..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}' \
  --max-time 10)

if [ "$response" = "200" ] || [ "$response" = "500" ] || [ "$response" = "400" ]; then
  echo "✅ 端点可访问 (HTTP $response)"
else
  echo "❌ 端点无法访问 (HTTP $response 或超时)"
  echo "   可能原因："
  echo "   - URL 不正确"
  echo "   - 服务器未运行"
  echo "   - 防火墙阻止"
  echo "   - SSL 证书问题"
fi
echo ""

# 测试 2: SSL 证书验证
echo "🔒 测试 2: SSL 证书验证..."
ssl_check=$(echo | openssl s_client -connect $(echo $WEBHOOK_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||'):443 -servername $(echo $WEBHOOK_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||') 2>&1 | grep -c "Verify return code: 0")

if [ "$ssl_check" -gt 0 ]; then
  echo "✅ SSL 证书有效"
else
  echo "⚠️  SSL 证书可能有问题（PayPal 要求有效证书）"
fi
echo ""

# 测试 3: 模拟 PayPal Webhook 请求
echo "📨 测试 3: 模拟 PayPal Webhook 请求..."
test_payload='{
  "id": "WH-TEST-123",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource_type": "capture",
  "resource": {
    "id": "CAPTURE-TEST-123",
    "status": "COMPLETED",
    "amount": {
      "currency_code": "USD",
      "value": "10.00"
    },
    "supplementary_data": {
      "related_ids": {
        "order_id": "ORDER-TEST-123"
      }
    },
    "invoice_id": "TEST-ORDER-123"
  },
  "create_time": "2024-01-27T10:00:00Z"
}'

response=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "PAYPAL-AUTH-ALGO: SHA256withRSA" \
  -H "PAYPAL-CERT-URL: https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2-4760-9d66-900a56a8c944" \
  -H "PAYPAL-TRANSMISSION-ID: test-transmission-id" \
  -H "PAYPAL-TRANSMISSION-SIG: test-signature" \
  -H "PAYPAL-TRANSMISSION-TIME: 2024-01-27T10:00:00Z" \
  -d "$test_payload" \
  --max-time 10 \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

if [ "$http_code" = "200" ]; then
  echo "✅ Webhook 请求成功 (HTTP $http_code)"
  echo "   响应: $body"
else
  echo "⚠️  Webhook 请求返回 HTTP $http_code"
  echo "   响应: $body"
fi
echo ""

# 总结
echo "📋 总结："
echo "   1. 如果端点可访问，下一步："
echo "      - 在 PayPal Dashboard 配置 Webhook URL: $WEBHOOK_URL (若项目 trailingSlash: true 则必须带尾部斜杠)"
echo "      - 使用 PayPal Webhook 模拟器发送测试事件"
echo "   2. 如果端点不可访问，检查："
echo "      - 服务器是否运行"
echo "      - URL 是否正确"
echo "      - 防火墙和网络配置"
echo "      - SSL 证书是否有效"
