import { useLayoutEffect, useRef, EffectCallback, DependencyList } from 'react';

const useDebouncedLayoutEffect = (
  effect: EffectCallback,
  delay: number,
  deps?: DependencyList
) => {
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>();
  const cleanup = useRef<ReturnType<EffectCallback>>(null);

  useLayoutEffect(() => {
    timeoutHandle.current = setTimeout(() => {
      cleanup.current = effect();
    }, delay);

    return () => {
      if (timeoutHandle.current != null) {
        clearTimeout(timeoutHandle.current);
      }

      if (typeof cleanup.current === 'function') {
        cleanup.current();
      }
    };
  }, [delay, ...deps]);
};

export default useDebouncedLayoutEffect;
