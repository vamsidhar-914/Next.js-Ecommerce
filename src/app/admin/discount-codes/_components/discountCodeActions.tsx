"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteDiscountCode,
  toggleDiscountCodeActive,
} from "../../_actions/discountCode";

export function ActivateToggleDropDown({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await toggleDiscountCodeActive(id, !isActive);
          router.refresh();
        });
      }}
    >
      {isActive ? "Deactivate" : "activate"}
    </DropdownMenuItem>
  );
}

export function DeleteDropdownItem({
  id,
  disabled,
}: {
  id: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteDiscountCode(id);
          router.refresh();
        });
      }}
    >
      Delete
    </DropdownMenuItem>
  );
}
