declare module "fumadocs-core/search/server" {
  export function createFromSource(source: any, options?: any): {
    GET: (request: Request) => Promise<Response>;
  };
}


