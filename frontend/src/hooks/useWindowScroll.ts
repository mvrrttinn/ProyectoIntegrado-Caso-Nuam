import { useEffect, useState } from 'react';

export function useWindowScroll(threshold = 8): boolean {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;

    const updateScrollState = () => {
      frameId = null;
      setHasScrolled(window.scrollY > threshold);
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateScrollState);
      }
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [threshold]);

  return hasScrolled;
}