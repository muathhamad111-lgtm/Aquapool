import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const PAGE_HEADER_ACTION_SLOT_ID = "page-header-action-slot";

export function PageHeaderAction({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById(PAGE_HEADER_ACTION_SLOT_ID);
    setNode(el);
  }, []);

  if (!node) return null;
  return createPortal(children, node);
}
