import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pen, Type, RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signature: { type: "drawn" | "typed"; data: string; name?: string } | null) => void;
  signerName?: string;
}

export function SignaturePad({ onSignatureChange, signerName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState(signerName || "");
  const [mode, setMode] = useState<"draw" | "type">("draw");

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw baseline
    drawBaseline(ctx, rect.width, rect.height);
  }, []);

  const drawBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(width - 20, height - 20);
    ctx.stroke();
    ctx.restore();

    // Restore drawing style
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
  };

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (hasDrawn && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSignatureChange({ type: "drawn", data: dataUrl });
    }
  }, [hasDrawn, onSignatureChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawBaseline(ctx, rect.width, rect.height);
    setHasDrawn(false);
    onSignatureChange(null);
  };

  const handleTypedNameChange = (value: string) => {
    setTypedName(value);
    if (value.trim().length >= 2) {
      onSignatureChange({ type: "typed", data: value.trim(), name: value.trim() });
    } else {
      onSignatureChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Your Signature</p>
        <p className="text-xs text-muted-foreground">
          Legally binding e-signature
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "draw" | "type")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="gap-1.5">
            <Pen className="h-3.5 w-3.5" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" className="gap-1.5">
            <Type className="h-3.5 w-3.5" />
            Type
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-3">
          <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-charcoal">
            <canvas
              ref={canvasRef}
              className="w-full h-28 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground/50">
                  Sign here with your mouse or finger
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="mt-3">
          <Input
            value={typedName}
            onChange={(e) => handleTypedNameChange(e.target.value)}
            placeholder="Type your full legal name"
            className="text-lg"
          />
          {typedName.trim().length >= 2 && (
            <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-charcoal">
              <p
                className="text-2xl text-center text-gray-800"
                style={{ fontFamily: "'Dancing Script', cursive, serif" }}
              >
                {typedName}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        By signing above, you acknowledge that this electronic signature is intended to have the same effect as a handwritten signature.
      </p>
    </div>
  );
}
