import { useCallback } from "react";

export function useHighlightText(searchText: string) {
  return useCallback(
    (text: string) => {
      if (!searchText || !text) return text;

      const parts = text.split(new RegExp(`(${searchText})`, "gi"));

      return parts.map((part, i) =>
        part.toLowerCase() === searchText.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 ">
            {part}
          </span>
        ) : (
          part
        )
      );
    },
    [searchText]
  );
}
