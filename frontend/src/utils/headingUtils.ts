export interface MarkdownHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Converts a raw heading string into a clean, URL-safe anchor slug.
 */
export const slugifyHeading = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[`*_~#]/g, "") // Strip markdown formatting
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .trim()
    .replace(/\s+/g, "-"); // Replace spaces with dashes
};

/**
 * Extracts all Level 2 (##) and Level 3 (###) headings from markdown text.
 */
export const extractHeadings = (markdown: string): MarkdownHeading[] => {
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3).trim();
      const id = slugifyHeading(text);
      if (id) {
        headings.push({ id, text, level: 2 });
      }
    } else if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4).trim();
      const id = slugifyHeading(text);
      if (id) {
        headings.push({ id, text, level: 3 });
      }
    }
  }

  return headings;
};
