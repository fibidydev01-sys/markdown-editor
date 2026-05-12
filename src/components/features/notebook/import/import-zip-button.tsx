"use client";

/**
 * Import ZIP button — file picker that triggers ZIP parsing.
 *
 * Used in two contexts:
 *   1. `/notebooks/new` page — to create a new notebook from ZIP
 *   2. Inside a notebook detail page — to import into existing
 *
 * Flow:
 *   1. User clicks button → opens file picker
 *   2. User selects .zip → parseZipFile() runs
 *   3. On success → opens ImportPreviewModal
 *   4. User confirms → calls onImport callback
 *
 * The button itself is presentational. Parent owns the modal state +
 * the actual import (so it can navigate, refresh, etc).
 */

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  parseZipFile,
  getZipErrorMessage,
  type ParsedZip,
} from "@/lib/notebook/import/zip-parser";
import { cn } from "@/lib/utils";

interface ImportZipButtonProps {
  /** Called when ZIP is parsed successfully — parent shows the modal. */
  onParsed: (parsed: ParsedZip, file: File) => void;
  /** Visual variant. */
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Override label text. */
  label?: string;
  /** Show icon. */
  showIcon?: boolean;
  disabled?: boolean;
}

export function ImportZipButton({
  onParsed,
  variant = "outline",
  size = "default",
  className,
  label = "Import ZIP",
  showIcon = true,
  disabled,
}: ImportZipButtonProps) {
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;

    // Basic extension check
    if (
      !file.name.toLowerCase().endsWith(".zip") &&
      file.type !== "application/zip" &&
      file.type !== "application/x-zip-compressed"
    ) {
      toast.error("Please select a .zip file");
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseZipFile(file);
      if (!result.ok) {
        toast.error(getZipErrorMessage(result.error));
        return;
      }
      onParsed(result.data, file);
    } catch (err) {
      console.error("[ImportZipButton] parse error:", err);
      toast.error("Failed to read ZIP file");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isParsing}
        className={cn(className)}
      >
        {isParsing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : showIcon ? (
          <Upload className="mr-2 h-4 w-4" />
        ) : null}
        {isParsing ? "Reading ZIP…" : label}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
}
