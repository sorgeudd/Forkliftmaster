import { useState, useEffect } from 'react';

type Viewport = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isMobile: boolean;
  scale: number;
};

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    scale: 1,
  });

  useEffect(() => {
    const calculateScale = (width: number, height: number) => {
      const baseWidth = 375; // iPhone SE width as baseline
      const baseHeight = 667; // iPhone SE height as baseline
      const aspectRatio = width / height;
      
      if (aspectRatio < 1) { // Portrait
        return Math.min(width / baseWidth, height / baseHeight);
      } else { // Landscape
        return Math.min(height / baseWidth, width / baseHeight);
      }
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      const scale = calculateScale(width, height);

      setViewport({
        width,
        height,
        orientation,
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        scale,
      });
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
}
