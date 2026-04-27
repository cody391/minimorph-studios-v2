import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

interface PhotoCropperProps {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string, croppedFile: File) => void;
  onCancel: () => void;
  outputSize?: number;
}

export default function PhotoCropper({
  imageSrc,
  onConfirm,
  onCancel,
  outputSize = 640,
}: PhotoCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw the preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Calculate draw dimensions
    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (size - drawW) / 2 + offset.x;
    const drawY = (size - drawH) / 2 + offset.y;

    // Draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Draw overlay (darkened corners outside circle)
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw circle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset, imageLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch handlers for drag
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.5, Math.min(3, z + delta)));
  };

  // Export cropped image
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const size = outputSize;
    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (size - drawW) / 2 + offset.x * (outputSize / 300);
    const drawY = (size - drawH) / 2 + offset.y * (outputSize / 300);

    // Clip to circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "profile-photo.jpg", {
            type: "image/jpeg",
          });
          onConfirm(dataUrl, file);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs text-soft-gray font-sans mb-2">
          Drag to reposition · Scroll or use slider to zoom
        </p>
      </div>

      {/* Canvas preview */}
      <div
        ref={containerRef}
        className="relative mx-auto rounded-lg overflow-hidden bg-black/90 select-none"
        style={{ width: 300, height: 300 }}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none" }}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-off-white/50 text-sm">
            Loading...
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-3 px-2">
        <ZoomOut className="w-4 h-4 text-soft-gray flex-shrink-0" />
        <Slider
          value={[zoom]}
          min={0.5}
          max={3}
          step={0.05}
          onValueChange={([v]) => setZoom(v)}
          className="flex-1"
        />
        <ZoomIn className="w-4 h-4 text-soft-gray flex-shrink-0" />
        <span className="text-[10px] text-soft-gray/60 font-mono w-10 text-right">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs rounded-full"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs rounded-full"
        >
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          className="text-xs rounded-full bg-electric hover:bg-electric/90 text-white"
        >
          <Check className="w-3 h-3 mr-1" /> Use This Photo
        </Button>
      </div>
    </div>
  );
}
