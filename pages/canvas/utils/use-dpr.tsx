import { useEffect, useState } from 'react';

export function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(window.devicePixelRatio);
  useEffect(() => {
    const list = matchMedia(`(resolution: ${dpr}dppx)`);
    const update = () => setDpr(window.devicePixelRatio);
    list.addEventListener('change', update);
    return () => {
      list.removeEventListener('change', update);
    };
  }, [dpr]);
  return { dpr };
}
