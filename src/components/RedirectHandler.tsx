import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRedirectPath } from '@/config/categoryRedirects';

/**
 * RedirectHandler - Handles 301-equivalent redirects for old category slugs
 * 
 * This component monitors the current URL and automatically redirects users
 * from old plural category slugs to new singular ones for SEO optimization.
 * 
 * Implementation:
 * - Runs on every route change
 * - Uses navigate(..., { replace: true }) for 301-equivalent behavior
 * - Preserves full path including subcategories and query params
 * - No visual rendering (returns null)
 * 
 * SEO Impact:
 * - Prevents 404 errors on old URLs
 * - Maintains link equity from external sources
 * - Signals to search engines that content has moved permanently
 */
export const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    const redirectPath = getRedirectPath(location.pathname);

    if (redirectPath) {
      // Preserve query params and hash
      const fullRedirectPath = redirectPath + location.search + location.hash;
      
      console.log('[RedirectHandler] Redirecting:', {
        from: currentPath,
        to: fullRedirectPath,
        type: '301-equivalent (replace: true)'
      });

      // Use replace: true to simulate 301 redirect (don't add to browser history)
      navigate(fullRedirectPath, { replace: true });
    }
  }, [location, navigate]);

  // This component has no visual output
  return null;
};
