/**
 * PayPal Webhook 诊断脚本
 * 用于排查为什么webhook没有被触发
 */

const https = require('https');
const http = require('http');

console.log('🔍 开始诊断 PayPal Webhook 问题...\n');

// 测试1: 检查本地服务
async function testLocalService() {
  console.log('📍 测试1: 检查本地服务 (localhost:3000)');

  return new Promise((resolve) => {
    const data = JSON.stringify({
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'test-capture-id',
        status: 'COMPLETED',
        supplementary_data: {
          related_ids: {
            order_id: 'test-order-123'
          }
        }
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/paypal-notify/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('  ✅ 本地服务正常响应');
        } else {
          console.log(`  ⚠️  本地服务返回状态码: ${res.statusCode}`);
          console.log(`  📄 响应: ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ 本地服务连接失败: ${e.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

// 测试2: 检查代理服务
async function testProxyService() {
  console.log('\n📍 测试2: 检查代理服务 (https://fast3d.online)');

  return new Promise((resolve) => {
    const data = JSON.stringify({
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'test-capture-id',
        status: 'COMPLETED',
        supplementary_data: {
          related_ids: {
            order_id: 'test-order-123'
          }
        }
      }
    });

    const options = {
      hostname: 'fast3d.online',
      port: 443,
      path: '/api/paypal-notify/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('  ✅ 代理服务正常响应');
        } else {
          console.log(`  ⚠️  代理服务返回状态码: ${res.statusCode}`);
          console.log(`  📄 响应: ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ 代理服务连接失败: ${e.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

// 测试3: 检查环境变量
function testEnvVariables() {
  console.log('\n📍 测试3: 检查环境变量配置');

  const requiredEnvs = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID'
  ];

  const fs = require('fs');
  const path = require('path');

  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');

      requiredEnvs.forEach(env => {
        if (envContent.includes(env)) {
          console.log(`  ✅ ${env} 已配置`);
        } else {
          console.log(`  ❌ ${env} 未配置`);
        }
      });
    } else {
      console.log('  ⚠️  .env.local 文件不存在');
    }
  } catch (e) {
    console.log(`  ❌ 读取环境变量失败: ${e.message}`);
  }
}

// 主函数
async function main() {
  await testLocalService();
  await testProxyService();
  testEnvVariables();

  console.log('\n' + '='.repeat(60));
  console.log('📋 诊断总结');
  console.log('='.repeat(60));
  console.log('\n如果上述测试都通过，但PayPal仍然不发送webhook，请检查：');
  console.log('\n1️⃣  PayPal Developer Dashboard → Webhooks');
  console.log('   - 确认webhook URL: https://fast3d.online/api/paypal-notify/');
  console.log('   - 确认已订阅事件: PAYMENT.CAPTURE.COMPLETED');
  console.log('   - 查看webhook日志，看是否有发送记录');
  console.log('\n2️⃣  使用 Webhook Simulator 手动测试');
  console.log('   - 在webhook详情页找到 "Send test notification"');
  console.log('   - 选择 PAYMENT.CAPTURE.COMPLETED 事件');
  console.log('   - 发送测试，查看是否成功');
  console.log('\n3️⃣  检查PayPal支付流程');
  console.log('   - 确认使用的是 Orders API v2');
  console.log('   - 确认支付完成后有 capture 操作');
  console.log('   - 只有 capture 成功才会触发 PAYMENT.CAPTURE.COMPLETED');
  console.log('\n4️⃣  查看本地服务日志');
  console.log('   - 运行: tail -f .next/server.log (如果有)');
  console.log('   - 或查看终端输出，看是否有webhook请求日志');
  console.log('\n');
}

main().catch(console.error);
