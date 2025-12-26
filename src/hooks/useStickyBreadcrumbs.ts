import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export const useStickyBreadcrumbs = (screenRef: RefObject<HTMLElement>) => {
  const [showStickyBreadcrumbs, setShowStickyBreadcrumbs] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = (event: Event) => {
      if (ticking) {
        return;
      }

      ticking = true;
      requestAnimationFrame(() => {
        const target = event.target as HTMLElement;
        const currentScrollY = target.scrollTop;
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        const threshold = 120;

        if (currentScrollY < threshold) {
          setShowStickyBreadcrumbs(false);
        } else if (direction === 'down') {
          setShowStickyBreadcrumbs(true);
        } else {
          setShowStickyBreadcrumbs(false);
        }

        lastScrollY.current = currentScrollY;
        ticking = false;
      });
    };

    const screenElement = screenRef.current;
    if (!screenElement) {
      return undefined;
    }

    screenElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      screenElement.removeEventListener('scroll', handleScroll);
    };
  }, [screenRef]);

  return { showStickyBreadcrumbs };
};
