import { useState, useEffect, useCallback, type RefObject } from "react";

export interface TextSelectionData {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  contextBefore: string;
  contextAfter: string;
  coords: { top: number; left: number } | null;
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selectionData, setSelectionData] = useState<TextSelectionData | null>(null);

  const clearSelection = useCallback(() => {
    setSelectionData(null);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const container = containerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      // Verify the selection is entirely or partially within container
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const selectedStr = selection.toString().trim();
      if (!selectedStr || selectedStr.length < 2) {
        return;
      }

      // Compute bounding box for floating popup
      const rangeRect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Top position above selected text, centered horizontally
      const top = rangeRect.top - containerRect.top;
      const left = rangeRect.left - containerRect.left + rangeRect.width / 2;

      // Extract context before and after
      const fullText = container.innerText || "";
      const foundIdx = fullText.indexOf(selectedStr);
      const startOffset = foundIdx >= 0 ? foundIdx : 0;
      const endOffset = startOffset + selectedStr.length;

      const contextBefore = fullText.slice(Math.max(0, startOffset - 60), startOffset);
      const contextAfter = fullText.slice(endOffset, Math.min(fullText.length, endOffset + 60));

      setSelectionData({
        selectedText: selectedStr,
        startOffset,
        endOffset,
        contextBefore,
        contextAfter,
        coords: { top, left },
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [containerRef]);

  return {
    selectionData,
    clearSelection,
  };
}
