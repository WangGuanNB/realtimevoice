# Cloudflare Workers 升级指南

## 快速升级步骤

执行命令  pnpm run cf:build

### 1. 创建配置文件

**创建 `wrangler.jsonc`**（项目根目录）
```jsonc
{
  "name": "your-project-name",
  "compatibility_date": "2025-01-10",
  "compatibility_flags": ["nodejs_compat"],
  "build": {
    "command": "pnpm run cf:build"
  },
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets"
  }
}
```
⚠️ **必须修改**：将 `"your-project-name"` 替换为实际项目名称

**创建 `open-next.config.ts`**（项目根目录）
```typescript
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
```

### 2. 修改 `next.config.mjs`

**必须修改：**
- ❌ 删除 `output: "standalone"`（如果存在）

**必须添加：**
```javascript
// 在 nextConfig 对象中添加
webpack: (config, { isServer }) => {
  if (isServer) {
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      minimize: true,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };
  }
  return config;
},
compress: true,
swcMinify: true,
experimental: {
  ...nextConfig.experimental, // 保留原有配置
  optimizePackageImports: [
    "@radix-ui/react-accordion",
    "@radix-ui/react-avatar",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "lucide-react",
    "framer-motion",
    // 根据项目添加其他大型 UI 库
  ],
},
```

### 3. 修改 `package.json`

在 `scripts` 中添加：
```json
"cf:build": "next build && npx @opennextjs/cloudflare@latest build",
"cf:deploy": "pnpm run cf:build && npx wrangler deploy"
```

### 4. 修改数据库连接（如果使用 PostgreSQL）

**修改 `src/db/index.ts`：**

```typescript
// 检测 Cloudflare Workers 环境
const isCloudflareWorker =
  (typeof globalThis !== "undefined" && "Cloudflare" in globalThis) ||
  (typeof process !== "undefined" && process.env.CF_PAGES === "1") ||
  (typeof navigator !== "undefined" && navigator.userAgent?.includes("Cloudflare"));

// 在 db() 函数中
if (isCloudflareWorker) {
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    idle_timeout: 10,
    connect_timeout: 5,
  });
  return drizzle(client);
}
// Node.js 环境保持原有逻辑
```

### 5. 检查 `.gitignore`

确保包含：
```
.wrangler
.open-next
```

## 检查清单

- [ ] `wrangler.jsonc` 已创建，项目名称已修改
- [ ] `open-next.config.ts` 已创建
- [ ] `next.config.mjs` 已移除 `output: "standalone"`
- [ ] `next.config.mjs` 已添加 webpack 优化配置
- [ ] `next.config.mjs` 已添加 `compress: true` 和 `swcMinify: true`
- [ ] `next.config.mjs` 已添加 `experimental.optimizePackageImports`
- [ ] `package.json` 已添加 `cf:build` 和 `cf:deploy` 脚本
- [ ] `src/db/index.ts` 已优化 Workers 环境检测（如使用数据库）
- [ ] `.gitignore` 包含 `.wrangler` 和 `.open-next`

## 注意事项

1. **项目名称**：`wrangler.jsonc` 中的 `name` 必须修改
2. **优化包列表**：根据项目实际使用的 UI 库调整 `optimizePackageImports`
3. **付费计划**：免费计划限制 3 MiB，付费计划 10 MiB（$5/月）


