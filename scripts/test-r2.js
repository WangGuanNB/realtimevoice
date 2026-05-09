// R2连接测试脚本
const { AwsClient } = require('aws4fetch');

async function testR2Connection() {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const bucket = process.env.STORAGE_BUCKET;

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    console.error('❌ 环境变量未配置完整');
    console.log('需要配置：STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET');
    return;
  }

  try {
    const client = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    });

    // 测试上传一个小文件
    const testContent = 'Hello from Miniatur AI R2 test!';
    const testKey = `test-${Date.now()}.txt`;
    
    console.log('🧪 开始测试R2连接...');
    console.log(`📍 端点: ${endpoint}`);
    console.log(`🪣 存储桶: ${bucket}`);

    const url = `${endpoint}/${bucket}/${testKey}`;
    const response = await client.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: testContent,
    });

    if (response.ok) {
      console.log('✅ R2连接测试成功！');
      console.log(`📄 测试文件已上传: ${testKey}`);
      
      // 测试读取
      const readResponse = await client.fetch(url, {
        method: 'GET',
      });
      
      if (readResponse.ok) {
        const content = await readResponse.text();
        console.log('✅ 文件读取成功！');
        console.log(`📖 内容: ${content}`);
        
        // 清理测试文件
        await client.fetch(url, { method: 'DELETE' });
        console.log('🧹 测试文件已清理');
      }
    } else {
      console.error('❌ R2上传失败');
      console.error(`状态码: ${response.status}`);
      console.error(`错误信息: ${response.statusText}`);
      const errorText = await response.text();
      console.error(`详细错误: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ R2连接测试失败:', error.message);
  }
}

// 运行测试
testR2Connection();