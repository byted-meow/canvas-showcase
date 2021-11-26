import { useCallback, useEffect, useMemo } from 'react';
import { useCanvasContext } from '../context';
import { CanvasDescriptor } from '../context/descriptor';

export function useRegisterCanvas(id: string, resetOnDestroy?: boolean) {
  const { registerCanvas, unregister } = useCanvasContext();
  const desc = useMemo<CanvasDescriptor>(
    () => registerCanvas(id) ?? new CanvasDescriptor(id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registerCanvas, unregister, id, resetOnDestroy],
  );
  useEffect(
    () => () => {
      if (resetOnDestroy) {
        unregister(item => item.id === id);
      }
    },
    [registerCanvas, unregister, id, resetOnDestroy],
  );
  // bind this
  const mainRef = useCallback(
    (next: HTMLCanvasElement | null) => {
      desc.mainCanvas = next;
    },
    [desc],
  );
  return { desc, mainRef };
}
