/**
 * Convert text to URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Generate SEO-friendly slug from title and ID
 */
export const generatePageSlug = (title: string, id: string): string => {
  const titleSlug = slugify(title);
  const shortId = id.slice(0, 8);
  return `${titleSlug}-${shortId}`;
};

/**
 * Extract ID from slug
 */
export const extractIdFromSlug = (slug: string): string | null => {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  return lastPart.length >= 8 ? lastPart : null;
};
