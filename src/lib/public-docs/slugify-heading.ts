/**
 * Slugify a heading text into an anchor id.
 *
 * Used by both:
 *   - `extract-headings.ts` (server-side, builds the right TOC)
 *   - `rehype-slug` (during markdown render, adds id attrs to <h2>/<h3>)
 *
 * Both MUST agree on the slug format so anchor links work.
 * We use the same logic that `rehype-slug` uses internally (github-slugger).
 *
 * For MVP we use a simpler version that matches the common cases:
 *   "## Hello World!" → "hello-world"
 *   "### Step 1: Install" → "step-1-install"
 *   "## Café résumé" → "cafe-resume"
 */

const DIACRITIC_MAP: Record<string, string> = {
  à: "a", á: "a", ä: "a", â: "a", ã: "a", å: "a", ā: "a",
  è: "e", é: "e", ë: "e", ê: "e", ē: "e",
  ì: "i", í: "i", ï: "i", î: "i", ī: "i",
  ò: "o", ó: "o", ö: "o", ô: "o", õ: "o", ō: "o", ø: "o",
  ù: "u", ú: "u", ü: "u", û: "u", ū: "u",
  ñ: "n", ç: "c", ß: "ss",
};

function removeDiacritics(text: string): string {
  return text
    .split("")
    .map((char) => DIACRITIC_MAP[char.toLowerCase()] ?? char)
    .join("");
}

/**
 * Convert heading text to a URL-safe anchor slug.
 *
 * Note: github-slugger has more elaborate rules (preserves underscores,
 * unicode, etc) — if you want exact parity with rehype-slug, swap this
 * out for `github-slugger`. The simple version below covers ~99% of
 * docs use cases.
 */
export function slugifyHeading(text: string): string {
  if (!text) return "";

  return removeDiacritics(text)
    .toLowerCase()
    .trim()
    // Remove markdown emphasis markers, code backticks, etc.
    .replace(/[`*_~]/g, "")
    // Replace any non-alphanumeric with hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
    // Trim hyphens from start/end
    .replace(/^-|-$/g, "");
}
