import { useEffect } from 'react';
import { CanvasDescriptor } from '../context/descriptor';
import { CanvasDimension } from './use-dimension-detector';
import { useDevicePixelRatio } from './use-dpr';

type CanvasDprConfig = {
  dimension: CanvasDimension;
  desc: CanvasDescriptor;
  // width * height
  dimensionLimit?: number;
};

export function useCanvasDpr(config: CanvasDprConfig) {
  const { dimension, desc, dimensionLimit } = config;
  const { dpr } = useDevicePixelRatio();
  let dprw = dpr;
  let dprh = dpr;
  if (
    dimensionLimit &&
    dpr * dpr * dimension.width * dimension.height > dimensionLimit
  ) {
    const ratio = dimension.width / dimension.height;
    const height = Math.floor(Math.sqrt(dimensionLimit / ratio));
    const width = Math.floor(height * ratio);
    dprw = width / dimension.width;
    dprh = height / dimension.height;
  }

  useEffect(() => {
    [desc.mainCanvas].forEach(canvas => {
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // scale 前先恢复
      ctx.scale(dprw, dprh);
    });
    desc.rasterizedLength = 0;
    desc.draw?.();
  }, [dprw, dprh, dimension, desc]);
  return {
    width: Math.round(dimension.width * dprw),
    height: Math.round(dimension.height * dprh),
  };
}
