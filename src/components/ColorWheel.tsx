import { useCallback, useEffect, useRef, useState } from 'react';
import { hsvToRgb, rgbToHsv } from '../utils/colorConversion';

interface ColorWheelProps {
  color: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
  size?: number;
}

export function ColorWheel({ color, onChange, size = 200 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hsv = rgbToHsv(color.r, color.g, color.b);
  const colorHex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate hue from angle
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Calculate saturation from distance, clamped to radius
    const saturation = Math.min(distance / radius, 1);

    // Convert to RGB and update
    const newColor = hsvToRgb(angle, saturation, 1);
    onChange(newColor);
  }, [onChange, size]);

  // Add document-level mouse listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      handleInteraction(e.clientX, e.clientY);
    };

    const handleDocumentMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging, handleInteraction]);

  // Draw the color wheel and indicator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 90) * (Math.PI / 180);
      const endAngle = (angle + 1 - 90) * (Math.PI / 180);

      // Draw saturation gradient for this hue slice
      for (let r = 0; r <= radius; r += 1) {
        const sat = r / radius;
        const rgb = hsvToRgb(angle, sat, 1);

        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.strokeStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw the selector indicator
    const angle = (hsv.h - 90) * (Math.PI / 180);
    const distance = hsv.s * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Draw indicator circle (white outer ring)
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw indicator circle (black inner ring)
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv, size]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only start dragging if click is inside the circle
    if (distance <= radius) {
      setIsDragging(true);
      handleInteraction(e.clientX, e.clientY);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let newHue = hsv.h;
    let newSat = hsv.s;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newHue = (hsv.h - step + 360) % 360;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newHue = (hsv.h + step) % 360;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newSat = Math.min(1, hsv.s + step / 100);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newSat = Math.max(0, hsv.s - step / 100);
        break;
      default:
        return;
    }

    const newColor = hsvToRgb(newHue, newSat, 1);
    onChange(newColor);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="cursor-crosshair focus:outline-2 focus:outline-primary focus:outline-offset-2"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Color picker wheel"
      aria-valuenow={Math.round(hsv.h)}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuetext={`Hue ${Math.round(hsv.h)} degrees, Saturation ${Math.round(hsv.s * 100)} percent, Color ${colorHex}`}
      tabIndex={0}
    />
  );
}
