import { useEffect } from "react";

// Sets the document (browser tab) title while a page is mounted — the SPA stand-
// in for Next.js's per-page `metadata.title`.
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
