/**
 * Generate URL-safe slugs from strings.
 *
 * Used for notebook slugs (for future publish/share URLs).
 *
 * Examples:
 *   "My First Notebook" → "my-first-notebook"
 *   "Hello World!" → "hello-world"
 *   "  Spaces  Everywhere  " → "spaces-everywhere"
 *   "Café résumé" → "cafe-resume"
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
 * Convert a string to a URL-safe slug.
 */
export function slugify(text: string): string {
  if (!text) return "";

  return removeDiacritics(text)
    .toLowerCase()
    .trim()
    // Replace any non-alphanumeric (including unicode) with hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
    // Trim hyphens from start/end
    .replace(/^-|-$/g, "");
}

/**
 * Make a slug unique by appending a number if it conflicts.
 *
 * @param baseSlug - the desired slug
 * @param existingSlugs - list of slugs already in use
 * @returns unique slug (e.g. "my-doc-2" if "my-doc" exists)
 */
export function makeUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;

  let counter = 2;
  let candidate = `${baseSlug}-${counter}`;
  while (existingSlugs.includes(candidate)) {
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
  return candidate;
}
