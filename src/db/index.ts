import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 用 Cloudflare D1 REST API 构造一个兼容 D1Database binding 接口的对象
 * 允许在 next dev 本地环境中直接连接远端 D1，无需 wrangler dev
 */
function createD1HttpClient(
  accountId: string,
  databaseId: string,
  token: string
): D1Database {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  async function query(sql: string, params?: unknown[]) {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sql, params: params ?? [] }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`D1 HTTP error ${res.status}: ${err}`);
    }
    const json = (await res.json()) as any;
    if (!json.success) {
      throw new Error(`D1 query failed: ${JSON.stringify(json.errors)}`);
    }
    return json.result[0];
  }

  function makeStatement(sql: string, params: unknown[] = []): D1PreparedStatement {
    return {
      bind(...args: unknown[]) {
        return makeStatement(sql, args);
      },
      async first<T = unknown>(col?: string): Promise<T | null> {
        const result = await query(sql, params);
        const row = result?.results?.[0] ?? null;
        if (row === null) return null;
        return (col ? row[col] : row) as T;
      },
      async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
        const result = await query(sql, params);
        return {
          results: result?.results ?? [],
          success: result?.success ?? true,
          meta: result?.meta ?? {},
        };
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        const result = await query(sql, params);
        return {
          results: (result?.results ?? []) as T[],
          success: result?.success ?? true,
          meta: result?.meta ?? {},
        };
      },
      async raw<T = unknown[]>(): Promise<T[]> {
        const result = await query(sql, params);
        const rows = (result?.results ?? []) as Record<string, unknown>[];
        return rows.map((row) => Object.values(row)) as T[];
      },
    };
  }

  return {
    prepare(sql: string) {
      return makeStatement(sql);
    },
    async dump(): Promise<ArrayBuffer> {
      throw new Error("dump() is not supported via HTTP API");
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      // D1 REST API 支持批量查询，但这里简化为逐个执行
      return Promise.all(statements.map((s) => s.all<T>()));
    },
    async exec(query: string): Promise<D1ExecResult> {
      const result = await makeStatement(query).run();
      return {
        count: 1,
        duration: (result.meta?.duration as number) ?? 0,
      };
    },
  };
}

/**
 * 获取 Drizzle D1 数据库实例
 * - 本地开发（next dev）：检测到 CLOUDFLARE_D1_TOKEN 时，通过 REST API 直连远端 D1
 * - 生产环境（Cloudflare Workers）：直接通过 binding 访问 D1
 */
export function db() {
  const token = process.env.CLOUDFLARE_D1_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  if (token && accountId && databaseId) {
    // 本地开发：通过 REST API 连接远端 D1
    return drizzle(createD1HttpClient(accountId, databaseId, token));
  }

  // 生产环境：通过 Workers binding 访问 D1
  const { env } = getCloudflareContext();
  return drizzle(env.DB);
}
