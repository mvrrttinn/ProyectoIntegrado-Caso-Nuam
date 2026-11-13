import { useCallback, useState } from 'react';
import type { RefCallback } from 'react';

export function useIntersection<T extends Element>(): [
  RefCallback<T>,
  boolean
] {
  const [isVisible, setIsVisible] = useState(false);

  const elementRef = useCallback<RefCallback<T>>((element) => {
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12
      }
    );

    observer.observe(element);
  }, []);

  return [elementRef, isVisible];
}