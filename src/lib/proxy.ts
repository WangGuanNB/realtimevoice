/**
 * 代理配置初始化
 * 用于在中国网络环境下访问 Google OAuth 等外部服务
 * 
 * 只在以下条件同时满足时启用：
 * 1. 服务器端环境（非浏览器）
 * 2. 设置了 GLOBAL_AGENT_HTTP_PROXY 环境变量
 * 3. 开发环境（额外保护，确保生产环境不受影响）
 */

// 只在服务器端环境且设置了代理环境变量时启用
if (
  typeof window === "undefined" &&
  process.env.GLOBAL_AGENT_HTTP_PROXY &&
  process.env.NODE_ENV !== "production" // 👈 生产环境永远不会执行这里
) {
  try {
    // 为 undici 配置代理（Next.js 15 使用 undici 作为 fetch 实现）
    // 这是关键：NextAuth 和 Next.js 的 fetch 都使用 undici
    const { ProxyAgent, setGlobalDispatcher } = require("undici");
    
    const proxyUrl = process.env.GLOBAL_AGENT_HTTP_PROXY || process.env.GLOBAL_AGENT_HTTPS_PROXY;
    
    if (proxyUrl) {
      const proxyAgent = new ProxyAgent(proxyUrl);
      setGlobalDispatcher(proxyAgent);
      console.log(`✅ 已为 undici 配置代理: ${proxyUrl}`);
    }
  } catch (err) {
    console.warn("⚠️  undici 代理配置失败，尝试使用 global-agent:", err);
    // Fallback: 如果 undici 代理配置失败，尝试 global-agent（用于其他使用原生 http/https 的代码）
    try {
      require("global-agent/bootstrap");
      console.log("✅ 已使用 global-agent 配置代理（fallback）");
    } catch (fallbackErr) {
      console.warn("⚠️  global-agent 代理配置也失败:", fallbackErr);
    }
  }
}


