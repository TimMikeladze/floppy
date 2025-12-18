"use client";

import type { VariantProps } from "class-variance-authority";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useConfirmDelete } from "@/lib/use-confirm-delete";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type DeleteButtonVariant = "inline" | "menu" | "dropdown";

interface DeleteButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick"> {
  onDelete: () => void;
  confirmMessage?: string;
  skipConfirmation?: boolean;
  /** Layout variant: inline (icon + text), menu (stacked icon/label), dropdown (for dropdown menus) */
  variant?: DeleteButtonVariant;
  buttonVariant?: ButtonVariant;
  size?: VariantProps<typeof buttonVariants>["size"];
}

export function DeleteButton({
  onDelete,
  confirmMessage,
  skipConfirmation = false,
  variant = "inline",
  buttonVariant = "ghost",
  size,
  children,
  className,
  ...props
}: DeleteButtonProps) {
  const handleDelete = useConfirmDelete(onDelete, {
    message: confirmMessage,
    skipConfirmation,
  });

  const content =
    children ??
    (variant === "menu" ? (
      <>
        <Trash2 className="h-5 w-5" />
        <span className="text-xs">Delete</span>
      </>
    ) : variant === "dropdown" ? (
      <>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </>
    ) : (
      <>
        <Trash2 className="h-4 w-4" />
        Delete
      </>
    ));

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleDelete}
      className={className}
      {...props}
    >
      {content}
    </Button>
  );
}
