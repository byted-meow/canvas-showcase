import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { noop, predicateAccept } from '../utils/noop';
import { SubscriptionCallback } from '../utils/use-create-subscription';
import { CanvasFloatingToolbar, CanvasFixedToolbar } from '../toolbar';
import { CanvasDescriptor } from './descriptor';
import {
  CanvasConfigType,
  defaultCanvasConfig,
  useInternalCanvasConfig,
} from './config';

interface CanvasContextProps {
  dimensionLimit?: number;
}

interface CanvasContextValue {
  //
  contextProps: CanvasContextProps;

  //
  registerCanvas: (id: string) => CanvasDescriptor;

  // canvas config
  config: CanvasConfigType;
  subscribeConfigChange: (
    cb: SubscriptionCallback<CanvasConfigType>,
    key?: keyof CanvasConfigType,
  ) => void;

  // undo redo clear
  undo: () => void;
  redo: () => void;
  clear: (callbackFn?: CanvasDescriptorPredicate) => void;
  unregister: (callbackFn?: CanvasDescriptorPredicate) => void;

  // toolbar ux
  getMostRecentCanvas: () => CanvasDescriptor | null;
}

const CanvasContext = createContext<CanvasContextValue>({
  contextProps: {},
  registerCanvas: noop,
  config: defaultCanvasConfig,
  subscribeConfigChange: noop,
  undo: noop,
  redo: noop,
  clear: noop,
  unregister: noop,
  getMostRecentCanvas: noop,
});

type CanvasProviderState = {
  lookup: Map<string, CanvasDescriptor>;
  _modifiedSequence: string[][];
  modifiedSequence: string[][];
  afterUndoLength?: number | undefined;
};

type CanvasDescriptorPredicate = (
  desc: CanvasDescriptor,
  index: number,
  all: CanvasDescriptor[],
) => boolean;

const updateEachTarget = (
  targets: CanvasDescriptor[],
  invoke: 'undo' | 'redo' | 'clear',
) => {
  const affected = new Set<CanvasDescriptor>();
  targets.forEach(target => {
    if (target[invoke]()) {
      affected.add(target);
    }
  });
  affected.forEach(i => i.draw());
  return affected;
};

export function CanvasProvider(
  props: React.PropsWithChildren<CanvasContextProps>,
) {
  const { children, ...contextProps } = props;

  const [ref] = useState<CanvasProviderState>(() => {
    const lookup = new Map<string, CanvasDescriptor>();
    const _modifiedSequence: string[][] = [];
    const obj: CanvasProviderState = {
      lookup,
      _modifiedSequence,
      modifiedSequence: new Proxy(_modifiedSequence, {
        get(t, p, r) {
          if (p === 'length' && obj.afterUndoLength != null) {
            return obj.afterUndoLength;
          }
          return Reflect.get(t, p, r);
        },
        set(t, p, v, r) {
          if (p !== 'length') {
            obj.afterUndoLength = undefined;
          }
          return Reflect.set(t, p, v, r);
        },
      }),
    };
    return obj;
  });

  const isBatchedUpdateRef = useRef<string[] | null>(null);
  const onCommittedUpdated = useCallback(
    (item: CanvasDescriptor) => {
      const isBatched = isBatchedUpdateRef.current;
      if (isBatched) {
        isBatched.push(item.id);
      } else {
        ref.modifiedSequence.push([item.id]);
      }
    },
    [ref],
  );
  const beginBatchUpdate = useCallback(
    <T,>(cb: () => T) => {
      if (isBatchedUpdateRef.current) {
        return cb();
      }
      isBatchedUpdateRef.current = [];
      const result = cb();
      if (isBatchedUpdateRef.current.length !== 0) {
        ref.modifiedSequence.push(isBatchedUpdateRef.current);
      }
      isBatchedUpdateRef.current = null;
      return result;
    },
    [ref],
  );

  const { config, subscribe } = useInternalCanvasConfig();

  const registerCanvas = useCallback(
    (id: string) => {
      if (ref.lookup.has(id)) {
        return ref.lookup.get(id)!;
      }
      const item = new CanvasDescriptor(id, config);
      item.onCommittedUpdated = onCommittedUpdated;
      ref.lookup.set(id, item);
      return item;
    },
    [ref, config, onCommittedUpdated],
  );

  const undo = useCallback(() => {
    const { afterUndoLength, modifiedSequence, lookup } = ref;
    const targetLength = (afterUndoLength ?? modifiedSequence.length) - 1;
    if (targetLength < 0) {
      return false;
    }
    ref.afterUndoLength = targetLength;
    const targets = modifiedSequence[targetLength]
      .map(key => lookup.get(key)!)
      .filter(Boolean);
    return updateEachTarget(targets, 'undo').size !== 0;
  }, [ref]);

  const redo = useCallback(() => {
    const { afterUndoLength, _modifiedSequence, lookup } = ref;
    if (
      afterUndoLength == null ||
      afterUndoLength >= _modifiedSequence.length
    ) {
      return false;
    }
    ref.afterUndoLength = afterUndoLength + 1;
    const targets = _modifiedSequence[afterUndoLength]
      .map(key => lookup.get(key)!)
      .filter(Boolean);

    return updateEachTarget(targets, 'redo').size !== 0;
  }, [ref]);

  const clear = useCallback(
    (callbackFn?: CanvasDescriptorPredicate) => {
      const { lookup } = ref;
      const targets = [...lookup.values()].filter(
        callbackFn || predicateAccept,
      );
      return beginBatchUpdate(
        () => updateEachTarget(targets, 'clear').size !== 0,
      );
    },
    [ref, beginBatchUpdate],
  );

  const unregister = useCallback(
    (callbackFn?: CanvasDescriptorPredicate) => {
      const { lookup } = ref;
      const targets = [...lookup.values()].filter(
        callbackFn || predicateAccept,
      );
      targets.forEach(desc => {
        let { afterUndoLength } = ref;
        let remaining = 0;
        const arr = ref._modifiedSequence;
        ref._modifiedSequence.forEach((_, index) => {
          const next = arr[index].filter(i => i !== desc.id);
          if (next.length === 0) {
            // reject
            if (afterUndoLength && index <= afterUndoLength) {
              afterUndoLength--;
            }
          } else {
            // accept
            arr[remaining] = next;
            remaining++;
          }
        });
        ref.afterUndoLength = afterUndoLength;
        arr.length = remaining;
        delete desc.onCommittedUpdated;
        lookup.delete(desc.id);
      });
    },
    [ref],
  );

  const getMostRecentCanvas = useCallback(() => {
    const { lookup, modifiedSequence } = ref;
    let target: CanvasDescriptor | null = null;
    if (modifiedSequence.length) {
      target = lookup.get(modifiedSequence.slice(-1)[0][0]) || null;
    } else if (lookup.size) {
      target = lookup.values().next().value;
    }
    return target;
  }, [ref]);

  const value: CanvasContextValue = {
    contextProps,
    config,
    subscribeConfigChange: subscribe,
    registerCanvas,
    undo,
    redo,
    clear,
    unregister,
    getMostRecentCanvas,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
      <CanvasFloatingToolbar />
      <CanvasFixedToolbar />
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  return useContext(CanvasContext);
}

export function useCanvasConfig(key?: keyof CanvasConfigType) {
  const context = useContext(CanvasContext);
  const [, update] = useReducer(() => ({}), {});
  useEffect(() => context.subscribeConfigChange(update, key), [key, context]);
  return context;
}
