/**
 * 扩展 @opennextjs/cloudflare 的 CloudflareEnv 接口
 * 声明项目中使用的 Cloudflare Bindings 类型
 */

// D1 最小类型 stub（避免依赖 @cloudflare/workers-types 包）
declare global {
  interface D1Result<T = Record<string, unknown>> {
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
    run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    raw<T = unknown[]>(): Promise<T[]>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    exec(query: string): Promise<D1ExecResult>;
    batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  }

  interface CloudflareEnv {
    /** D1 数据库 binding（对应 wrangler.jsonc 中的 binding: "DB"） */
    DB: D1Database;
  }
}
export {};
