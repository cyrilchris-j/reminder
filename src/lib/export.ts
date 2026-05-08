// ============================================
// MindFlow — Export Utilities for Notes
// Supports Markdown, JSON, and text export
// ============================================

/**
 * Export note content as Markdown
 */
export function exportAsMarkdown(title: string, plainText: string, tags: string[]): void {
  const tagLine = tags.length > 0 ? `\nTags: ${tags.map(t => `#${t}`).join(" ")}\n` : "";
  const content = `# ${title}\n${tagLine}\n${plainText}`;

  downloadFile(content, `${sanitizeFilename(title)}.md`, "text/markdown");
}

/**
 * Export note content as JSON
 */
export function exportAsJSON(
  title: string,
  content: Record<string, unknown>,
  plainText: string,
  tags: string[],
  createdAt: string,
  updatedAt: string
): void {
  const data = {
    title,
    content,
    plain_text: plainText,
    tags,
    created_at: createdAt,
    updated_at: updatedAt,
    exported_at: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${sanitizeFilename(title)}.json`,
    "application/json"
  );
}

/**
 * Export note content as plain text
 */
export function exportAsText(title: string, plainText: string): void {
  const content = `${title}\n${"=".repeat(title.length)}\n\n${plainText}`;
  downloadFile(content, `${sanitizeFilename(title)}.txt`, "text/plain");
}

/**
 * Generate and download a PDF-like HTML file (lightweight, no external deps)
 */
export function exportAsPrintableHTML(title: string, htmlContent: string, tags: string[]): void {
  const tagBadges = tags.map(t => `<span style="display:inline-block;background:#f0f0f0;border-radius:4px;padding:2px 8px;margin:2px;font-size:12px;">#${t}</span>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} — MindFlow</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .tags { margin-bottom: 16px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
    hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    blockquote { border-left: 3px solid #6366f1; padding-left: 12px; color: #555; font-style: italic; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${tagBadges ? `<div class="tags">${tagBadges}</div>` : ""}
  <div class="meta">Exported from MindFlow on ${new Date().toLocaleDateString()}</div>
  <hr>
  <div>${htmlContent || "<p>Empty note</p>"}</div>
</body>
</html>`;

  downloadFile(html, `${sanitizeFilename(title)}.html`, "text/html");
}

// ---- Helpers ----

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50) || "untitled";
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
