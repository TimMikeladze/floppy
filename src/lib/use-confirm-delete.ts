"use client";

import { useCallback } from "react";

interface UseConfirmDeleteOptions {
  message?: string;
  skipConfirmation?: boolean;
}

export function useConfirmDelete(
  onDelete: () => void,
  options: UseConfirmDeleteOptions = {},
) {
  const {
    message = "Are you sure you want to delete this comic?",
    skipConfirmation = false,
  } = options;

  const handleDelete = useCallback(() => {
    if (skipConfirmation || confirm(message)) {
      onDelete();
    }
  }, [onDelete, message, skipConfirmation]);

  return handleDelete;
}
