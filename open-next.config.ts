// OpenNext 配置（Cloudflare 适配器）
// 目的：配置 Next.js 应用以适配 Cloudflare Workers 环境
// 注意：这里不用引入任何类型，避免 Next 类型检查时找不到包的声明导致失败

const config = {
  default: {
    outDir: ".open-next",
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
