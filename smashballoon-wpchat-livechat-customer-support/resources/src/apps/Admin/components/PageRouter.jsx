import React, { Suspense, lazy, useEffect } from 'react';
import { Route, HashRouter as Router, Routes, useLocation } from 'react-router';
import { isPro } from '@Utils/isPro';

// Constants for WordPress admin integration
const PAGE_SLUG = 'wp-chat';
const MENU_SELECTOR = `#toplevel_page_${PAGE_SLUG} .wp-submenu a`;
const LEFT_SEPARATOR = '‹';
const DEFAULT_SUFFIX = 'WordPress';

// Lazy-loaded pages
const Home = lazy(() => import('@AP/Home/Home'));
const Onboarding = lazy(() => import('@AP/Onboarding'));
const Agent = lazy(() => import('@AP/Agent/Agent'));
const AgentSingle = lazy(() => import('@AP/Agent/AgentSingle'));
const Visibility = lazy(() => import('@AP/Visibility'));
const Settings = lazy(() => import('@AP/Settings'));
const Customizer = lazy(() => import('@AP/Customizer/Customizer'));
const Support = lazy(() => import('@AP/Support/Support'));

const FaqViews = {
  Archive: lazy(() => import('@AP/Faq/Faq')),
  Single: lazy(() => import('@AP/Faq/FaqSingle')),
};

const FunnelViews = {
  Archive: lazy(() => import('@AP/Funnel/Funnel')),
  ...(isPro && {
    Single: lazy(() => import('@APPro/Funnel/FunnelSingle')),
    SingleCreateEdit: lazy(() => import('@APPro/Funnel/FunnelCreateEdit')),
    FunnelVisibility: lazy(() => import('@APPro/Funnel/FunnelVisibility')),
  }),
};

const AgentSettings = lazy(() => import('@AP/Agent/AgentSettings'));

// Dev-only icon catalog — hidden route, not linked anywhere in UI
const IconCatalog = lazy(() => import('@AP/IconCatalog'));

/** Extract suffix from WordPress admin title */
function getAdminTitleSuffix(title) {
  if (!title || !title.includes(LEFT_SEPARATOR)) {
    return `${LEFT_SEPARATOR} ${DEFAULT_SUFFIX}`;
  }
  const separatorIndex = title.indexOf(LEFT_SEPARATOR);
  const suffix = title.substring(separatorIndex + 1).trim();
  return `${LEFT_SEPARATOR} ${suffix || DEFAULT_SUFFIX}`;
}

/** Highlight menu and update document title */
function useAdminMenu() {
  const location = useLocation();

  useEffect(() => {
    const submenuLinks = document.querySelectorAll(MENU_SELECTOR);

    if (!submenuLinks.length) return;

    const currentHash = window.location.hash;

    submenuLinks.forEach((link) => {
      const li = link.closest('li');
      if (!li) return;

      li.classList.remove('current');
      link.removeAttribute('aria-current');

      const linkUrl = new URL(link.href);
      const linkHash = linkUrl.hash || '';

      if (currentHash) {
        if (linkHash) {
          // Match exact hash or if current hash starts with the menu's base path
          // This handles nested routes like #/agents/edit/123 matching #/agents menu item
          if (currentHash === linkHash || currentHash.startsWith(`${linkHash}/`)) {
            li.classList.add('current');
            link.setAttribute('aria-current', 'page');

            const linkText = link.textContent?.trim();
            if (linkText) {
              document.title = `${linkText} ${getAdminTitleSuffix(document.title)}`;
            }
          }
        } else if (link.href.endsWith(currentHash)) {
          // Fallback for exact matches
          li.classList.add('current');
          link.setAttribute('aria-current', 'page');

          const linkText = link.textContent?.trim();
          if (linkText) {
            document.title = `${linkText} ${getAdminTitleSuffix(document.title)}`;
          }
        }
      } else {
        // No hash = home page
        if (linkUrl.searchParams.get('page') === PAGE_SLUG && !link.href.includes('#')) {
          li.classList.add('current');
          link.setAttribute('aria-current', 'page');

          const linkText = link.textContent?.trim();
          if (linkText) {
            document.title = `${linkText} ${getAdminTitleSuffix(document.title)}`;
          }
        }
      }
    });
  }, [location.pathname, location.hash]);
}

/** Intercept top-level menu clicks to prevent page reload */
function useInterceptMenuClicks() {
  useEffect(() => {
    const topMenu = document.getElementById(`toplevel_page_${PAGE_SLUG}`);

    // Early return if menu not found
    if (!topMenu) return;

    const handleClick = (e) => {
      // Only process anchor tags
      const link = e.target.closest('a');
      if (!link || !topMenu.contains(link)) return;

      try {
        const url = new URL(link.href);
        if (url.searchParams.get('page') === PAGE_SLUG) {
          e.preventDefault();
          window.history.pushState({}, '', link.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch {
        // Invalid URL, ignore
      }
    };

    // Use event delegation instead of multiple listeners
    topMenu.addEventListener('click', handleClick);
    return () => topMenu.removeEventListener('click', handleClick);
  }, []);
}

/** Main PageRouter */
export default function PageRouter() {
  useInterceptMenuClicks();

  return (
    <Router initialEntries={['/']}>
      <PageRoutes />
    </Router>
  );
}

/** Routes component */
function PageRoutes() {
  useAdminMenu();

  return (
    <div className='wpchat:relative'>
      <Suspense>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/getting-started' element={<Onboarding />} />
          <Route path='/agents' element={<Agent />} />
          <Route path='/agents/create' element={<AgentSingle />} />
          <Route path='/agents/edit/:slug' element={<AgentSingle />} />
          {AgentSettings && <Route path='/agents/settings' element={<AgentSettings />} />}
          <Route path='/visibility' element={<Visibility />} />
          <Route path='/faqs' element={<FaqViews.Archive />} />
          <Route path='/faqs/create' element={<FaqViews.Single />} />
          <Route path='/faqs/edit/:id' element={<FaqViews.Single />} />
          <Route path='/funnels' element={<FunnelViews.Archive />} />
          {FunnelViews.Single && <Route path='/funnels/:id' element={<FunnelViews.Single />} />}
          {FunnelViews.SingleCreateEdit && (
            <>
              <Route path='/funnels/create' element={<FunnelViews.SingleCreateEdit />} />
              <Route path='/funnels/edit/:id' element={<FunnelViews.SingleCreateEdit />} />
            </>
          )}
          {FunnelViews.FunnelVisibility && (
            <Route path='/funnels/visibility/:id' element={<FunnelViews.FunnelVisibility />} />
          )}
          <Route path='/customizer' element={<Customizer />} />
          <Route path='/support' element={<Support />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/dev/icons' element={<IconCatalog />} />
        </Routes>
      </Suspense>
    </div>
  );
}
