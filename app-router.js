/**
 * @typedef {({
 *    request,
 *    params
 *  }: {
 *    request: Request;
 *    params: Record<string, string | undefined>;
 *  }
 * ) => Response | Promise<Response>} Handler
 */

/**
 * @typedef {{
 *  method: "GET" | "POST";
 *  pattern: URLPattern;
 *  handler: Handler;
 * }} Route
 */

export default class AppRouter {
  /** @type {Route[]} */ routes;

  constructor() {
    this.routes = [];
  }

  get(
    /** @type {string} */ pathname,
    /** @type {Handler} */ handler,
  ) {
    this.routes.push({
      method: "GET",
      pattern: new URLPattern({ pathname }),
      handler,
    });
  }

  post(
    /** @type {string} */ pathname,
    /** @type {Handler} */ handler,
  ) {
    this.routes.push({
      method: "POST",
      pattern: new URLPattern({ pathname }),
      handler,
    });
  }

  handle(/** @type {FetchEvent} */ event) {
    for (const route of this.routes) {
      const match = route.pattern.exec(event.request.url);
      if (match && event.request.method === route.method) {
        const params = match.pathname.groups;
        return route.handler({ request: event.request, params });
      }
    }
  }
}
