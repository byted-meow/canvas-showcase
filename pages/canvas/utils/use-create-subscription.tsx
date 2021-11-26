import { useMemo, useCallback } from 'react';

export type SubscriptionCallback<T extends Record<string, unknown>> = (
  prev: T,
  next: T,
) => void;

export function useCreateSubscription<T extends Record<string, unknown>>(
  target: T,
) {
  type Callback = SubscriptionCallback<T>;
  const { subscription, proxied } = useMemo(
    () => ({
      subscription: new Set<Callback>(),
      proxied: new Proxy(target, {
        set(t, p, v, r) {
          const prev = { ...t };
          const result = Reflect.set(t, p, v, r);
          subscription.forEach(item => item(prev, t));
          return result;
        },
      }),
    }),
    [target],
  );
  const subscribe = useCallback(
    (func: Callback, key?: keyof T) => {
      const cb: Callback = (prev, next) => {
        if (key == null || prev[key] !== next[key]) {
          func(prev, next);
        }
      };
      subscription.add(cb);
      return () => subscription.delete(cb);
    },
    [subscription],
  );

  return { proxied, subscribe };
}
