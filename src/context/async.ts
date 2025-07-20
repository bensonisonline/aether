import { AsyncLocalStorage } from "node:async_hooks";

export const asyncContext = new AsyncLocalStorage<RequestStore>();

export function getRequestContext(): RequestStore | undefined {
    return asyncContext.getStore();
}
