import { useMemo } from 'react';
import { useCreateSubscription } from '../utils/use-create-subscription';

export type BrushType = 'pen' | 'eraser' | 'chalk' | 'stroke';
export type CanvasState = 'normal' | 'locked' | 'hidden';

export type CanvasConfigType = {
  color: string;
  lineWidth: number;
  eraserWidth: number;
  type: BrushType;
  canvasState: CanvasState;
};

export const defaultCanvasConfig: CanvasConfigType = {
  type: 'pen',
  canvasState: 'normal',
  color: '#000000',
  lineWidth: 4,
  eraserWidth: 16,
};

export function useInternalCanvasConfig() {
  const target = useMemo<CanvasConfigType>(
    () => ({
      ...defaultCanvasConfig,
      canvasState: 'locked',
    }),
    [],
  );
  const { proxied, subscribe } = useCreateSubscription(target);
  return { config: proxied, subscribe };
}
