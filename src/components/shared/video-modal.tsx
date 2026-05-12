"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

/**
 * YouTube video modal using shadcn Dialog.
 * Replaces old @headlessui/react Dialog.
 */
export function VideoModal({ isOpen, onClose, videoId }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black border-none">
        <VisuallyHidden>
          <DialogTitle>Video Player</DialogTitle>
        </VisuallyHidden>
        <div className="relative pt-[56.25%]">
          <iframe
            src={isOpen ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : ""}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
