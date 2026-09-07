/**
 * Server-side input sanitizer helper to prevent XSS (Cross-Site Scripting)
 * and malicious HTML injection in user inputs.
 */

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return ""

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

export function sanitizeMarkdown(input: string | null | undefined): string {
  if (!input) return ""

  // Strip dangerous script tags, event handlers, and javascript: URIs
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:[^\s"']+/gi, "#")
    .trim()
}
