import { useState, useEffect, MutableRefObject } from 'react';
import { addListener, removeListener } from 'resize-detector';
import { debounce } from 'lodash-es';

export type CanvasDimension = {
  width: number;
  height: number;
};

export function useDimensionDetector(ref: MutableRefObject<HTMLDivElement>) {
  const [dimension, setDimension] = useState<CanvasDimension>({
    width: 1,
    height: 1,
  });
  useEffect(() => {
    const { current } = ref;
    const updateDimension = debounce(() => {
      setDimension({
        width: current.clientWidth,
        height: current.clientHeight,
      });
    }, 100);
    updateDimension();
    addListener(current, updateDimension);
    return () => {
      updateDimension.cancel();
      removeListener(current, updateDimension);
    };
  }, [ref]);

  return { dimension };
}
