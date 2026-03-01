import { useState, useEffect, useCallback } from 'react';

/**
 * Maps coordinates from image-space (0-1 fractions) to viewport-space (px),
 * accounting for background-size: cover and background-position: center.
 *
 * @param {number} imgWidth  - Natural image width
 * @param {number} imgHeight - Natural image height
 * @param {Array<{x: number, y: number}>} points - Image-space coordinates (0-1)
 * @returns {Array<{x: number, y: number}>} Viewport pixel coordinates
 */
export default function useImagePosition(imgWidth, imgHeight, points) {
  const [mapped, setMapped] = useState(() => points.map(() => ({ x: 0, y: 0 })));

  const calculate = useCallback(() => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const imgRatio = imgWidth / imgHeight;
    const vpRatio = vpW / vpH;

    let displayW, displayH, offsetX, offsetY;

    if (vpRatio > imgRatio) {
      // Viewport wider than image — image fills width, cropped top/bottom
      displayW = vpW;
      displayH = vpW / imgRatio;
      offsetX = 0;
      offsetY = (displayH - vpH) / 2;
    } else {
      // Viewport taller than image — image fills height, cropped left/right
      displayH = vpH;
      displayW = vpH * imgRatio;
      offsetX = (displayW - vpW) / 2;
      offsetY = 0;
    }

    const next = points.map((pt) => ({
      x: (pt.x * displayW) - offsetX,
      y: (pt.y * displayH) - offsetY,
    }));

    setMapped(next);
  }, [imgWidth, imgHeight, points]);

  useEffect(() => {
    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [calculate]);

  return mapped;
}
