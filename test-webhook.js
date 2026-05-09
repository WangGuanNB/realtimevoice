/**
 * 测试PayPal Webhook是否可以接收请求
 */

const testWebhook = async () => {
  const webhookUrl = 'https://fast3d.online/api/paypal-notify/';

  // 模拟PayPal发送的webhook数据
  const testPayload = {
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: {
      id: 'test-capture-id',
      status: 'COMPLETED',
      amount: {
        currency_code: 'USD',
        value: '10.00'
      },
      supplementary_data: {
        related_ids: {
          order_id: 'test-order-id'
        }
      }
    }
  };

  console.log('🔔 测试发送webhook到:', webhookUrl);
  console.log('📦 测试数据:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('✅ 响应状态:', response.status);
    const text = await response.text();
    console.log('📄 响应内容:', text);

    if (response.ok) {
      console.log('✅ Webhook URL可以正常接收请求！');
    } else {
      console.log('❌ Webhook返回错误状态码');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
};

testWebhook();
