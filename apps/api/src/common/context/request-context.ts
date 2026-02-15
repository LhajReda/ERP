import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId: string;
  startTime: number;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export const requestContext = {
  run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  },
  getStore(): RequestContextStore | undefined {
    return storage.getStore();
  },
  getRequestId(): string | null {
    return storage.getStore()?.requestId ?? null;
  },
  getStartTime(): number | null {
    return storage.getStore()?.startTime ?? null;
  },
};
