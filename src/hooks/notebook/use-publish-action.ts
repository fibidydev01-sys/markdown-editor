"use client";

/**
 * usePublishAction — encapsulates publish/unpublish mutations.
 *
 * - Manages isPublishing / isUnpublishing state
 * - Surfaces typed errors (PublishError) so caller can branch on code
 *   (e.g. show upgrade CTA for FREE_TIER_LIMIT)
 * - Does NOT toast — caller decides UX (modal vs toast vs inline error)
 *
 * Usage:
 *   const { publish, unpublish, isPublishing, isUnpublishing } = usePublishAction();
 *
 *   try {
 *     const result = await publish({ notebookId, slug });
 *     toast.success("Published!");
 *   } catch (err) {
 *     if (err instanceof PublishError && err.code === "FREE_TIER_LIMIT") {
 *       // show upgrade modal
 *     }
 *   }
 */

import { useCallback, useState } from "react";
import {
  publishNotebook,
  unpublishNotebook,
  type PublishOptions,
} from "@/lib/notebook/publish";
import type { PublishResult, UnpublishResult } from "@/types/publish";

interface UsePublishActionReturn {
  publish: (options: PublishOptions) => Promise<PublishResult>;
  unpublish: (notebookLocalId: string) => Promise<UnpublishResult>;
  isPublishing: boolean;
  isUnpublishing: boolean;
}

export function usePublishAction(): UsePublishActionReturn {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const publish = useCallback(async (options: PublishOptions) => {
    setIsPublishing(true);
    try {
      return await publishNotebook(options);
    } finally {
      setIsPublishing(false);
    }
  }, []);

  const unpublish = useCallback(async (notebookLocalId: string) => {
    setIsUnpublishing(true);
    try {
      return await unpublishNotebook(notebookLocalId);
    } finally {
      setIsUnpublishing(false);
    }
  }, []);

  return { publish, unpublish, isPublishing, isUnpublishing };
}
