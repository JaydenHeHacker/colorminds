/**
 * Category slug redirects mapping (plural → singular)
 * Used for SEO optimization to match higher-volume search terms
 * 
 * Priority levels based on Golden Score and search volume:
 * - Critical: 90-100 (adult, unicorn, flower, princess)
 * - High: 60-89 (cat, dinosaur, dog)
 * - Medium: 40-59 (butterfly, mermaid, dragon)
 * - Standard: <40 (bird, tree, vehicle)
 */
export const categoryRedirects: Record<string, string> = {
  // Critical Priority (Golden Score 90-100)
  'adults': 'adult',           // 85,370/mo, KD 43, Score 100
  'unicorns': 'unicorn',       // 72,330/mo, KD 28, Score 98
  'flowers': 'flower',         // 56,190/mo, KD 23, Score 91
  'princesses': 'princess',    // 51,770/mo, KD 20, Score 89
  
  // High Priority (Golden Score 60-89)
  'cats': 'cat',               // 46,350/mo, KD 17, Score 68
  'dinosaurs': 'dinosaur',     // 44,180/mo, KD 23, Score 65
  'dogs': 'dog',               // 43,050/mo, KD 18, Score 63
  
  // Medium Priority (Golden Score 40-59)
  'butterflies': 'butterfly',  // 38,930/mo, KD 26, Score 59
  'mermaids': 'mermaid',       // 36,820/mo, KD 25, Score 57
  'dragons': 'dragon',         // 25,170/mo, KD 26, Score 45
  
  // Standard Priority (Golden Score <40)
  'birds': 'bird',             // 18,610/mo, KD 22, Score 38
  'trees': 'tree',             // 10,520/mo, KD 21, Score 26
  'vehicles': 'vehicle',       // 9,180/mo, KD 28, Score 24
};

/**
 * Check if a path contains an old category slug that needs redirection
 * Handles both formats:
 * - /category/unicorns
 * - /category/all/unicorns
 * - /category/parent-slug/unicorns
 */
export const getRedirectPath = (currentPath: string): string | null => {
  for (const [oldSlug, newSlug] of Object.entries(categoryRedirects)) {
    // Check if the old slug appears in the path
    // Match patterns like:
    // - /category/adults -> /category/adult
    // - /category/all/adults -> /category/all/adult
    // - /category/animals/cats -> /category/animals/cat
    
    const pathSegments = currentPath.split('/');
    const slugIndex = pathSegments.findIndex(segment => segment === oldSlug);
    
    if (slugIndex !== -1) {
      // Replace the old slug with new slug
      pathSegments[slugIndex] = newSlug;
      return pathSegments.join('/');
    }
  }
  return null;
};
