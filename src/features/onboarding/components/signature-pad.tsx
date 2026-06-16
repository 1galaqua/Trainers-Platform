"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignaturePadProps = {
  onChange: (dataUrl: string) => void;
  invalid?: boolean;
};

export function SignaturePad({ onChange, invalid }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInkRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function emitSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInkRef.current) {
      onChange("");
      return;
    }
    onChange(canvas.toDataURL("image/png"));
  }

  function startDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    hasInkRef.current = true;
    const { x, y } = getPoint(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
    emitSignature();
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    onChange("");
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className={cn(
          "w-full touch-none rounded-lg border bg-white",
          invalid ? "border-destructive" : "border-border",
        )}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        aria-label="אזור חתימה דיגיטלית"
        aria-invalid={invalid}
      />
      <Button type="button" variant="outline" size="sm" onClick={clear}>
        נקה חתימה
      </Button>
    </div>
  );
}
