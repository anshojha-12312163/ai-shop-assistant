import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Upload, Sparkles, Image as ImageIcon, Scan, Layers } from "lucide-react";
import { toast } from "sonner";

interface VisualLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageDataUrl: string) => void;
}

const SAMPLE_IMAGES = [
  {
    label: "Nike Sneakers",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    label: "Zudio Denim Jacket",
    url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=800&auto=format&fit=crop&q=80",
    category: "Fashion",
  },
  {
    label: "Coffee Cup",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    category: "Cafe",
  },
  {
    label: "Pharmacy Box",
    url: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80",
    category: "Pharmacy",
  },
];

export function VisualLensModal({ isOpen, onClose, onSelectImage }: VisualLensModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clipboard Paste Support
  useEffect(() => {
    if (!isOpen) return;

    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            readAndSelectFile(file);
            toast.success("Pasted image from clipboard!");
          }
          break;
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  function readAndSelectFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onSelectImage(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readAndSelectFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readAndSelectFile(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="relative w-full max-w-xl bg-surface-elevated border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
          title="Close"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent font-mono text-xs font-bold rounded-full border border-accent/30 mb-2">
            <Scan className="size-3.5 animate-pulse" />
            <span>SYNTHETIX VISUAL LENS</span>
          </div>
          <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
            Scan a Photo to Find Stores
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Upload any product photo or snapshot. AI detects objects, extracts OCR text, and locates
            matching stores in India.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`p-8 border-2 border-dashed rounded-3xl text-center space-y-4 transition-all ${
            isDragOver
              ? "border-accent bg-accent/10 ring-4 ring-accent/20 scale-[1.01]"
              : "border-border hover:border-accent/40 bg-secondary/30"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="size-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto border border-accent/20">
            <ImageIcon className="size-7 animate-bounce" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Drag & Drop Product Image</h4>
            <p className="text-xs text-muted-foreground">
              Or paste directly from clipboard{" "}
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border font-mono text-[10px]">
                Ctrl+V
              </kbd>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Upload className="size-4" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2.5 bg-background text-foreground hover:bg-secondary border border-border rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Camera className="size-4 text-accent" />
              <span>Camera Capture</span>
            </button>
          </div>
        </div>

        {/* Sample Images Section */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Sparkles className="size-3.5 text-accent" />
              <span>TRY DEMO SAMPLES:</span>
            </span>
            <span className="text-muted-foreground">Click to scan instantly</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.label}
                onClick={() => {
                  onSelectImage(sample.url);
                  onClose();
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border hover:border-accent transition-all text-left"
              >
                <img
                  src={sample.url}
                  alt={sample.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-[11px] font-bold leading-tight truncate">{sample.label}</p>
                  <span className="text-[9px] text-white/70 font-mono">{sample.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
