import React, { useEffect, useRef } from 'react';
import { Route, MemoryRouter as Router, Routes, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { useChatStore } from '@Frontend/context/ChatStoreContext';
import PageLayout from '@FC/PageLayout';
import Chat from '@FP/chat';
import Home from '@FP/home';

/**
 * PageRouter component manages routing between different pages in the application.
 *
 * @component
 * @returns {JSX.Element} The rendered PageRouter component.
 */
export default function PageRouter() {
  const initialRoute = useChatStore((s) => s.initialRoute);

  return (
    <Router initialEntries={[initialRoute]}>
      <PageRoutes />
    </Router>
  );
}

/**
 * PageRoutes component defines and returns the application's route configuration.
 *
 * @component
 * @returns {JSX.Element} The rendered PageRoutes component containing the defined routes.
 */
function PageRoutes() {
  const location = useLocation();
  const isPreviewMode = useChatStore((s) => s.isPreviewMode);
  const containerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  // Focus management on internal navigation (Home <-> Chat): the activated
  // control (FAQ button, 'Send us a message' card, back chevron) unmounts
  // with the outgoing view, which would drop focus to <body>. Move focus to
  // the incoming view's heading / first logical element instead. Skipped on
  // initial mount (Frontend.jsx already focuses the dialog when the widget
  // opens) and in preview mode (the customizer drives the route).
  useEffect(() => {
    if (isPreviewMode || prevPathRef.current === location.pathname) {
      prevPathRef.current = location.pathname;
      return;
    }
    prevPathRef.current = location.pathname;

    let rafId2;
    // Double rAF: wait for AnimatePresence/Framer Motion to make the
    // incoming view displayable (it mounts with display:none).
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        // Scope to the incoming view — the outgoing one is still in the DOM
        // while its exit animation runs.
        const view = containerRef.current?.querySelector(`[data-route="${location.pathname}"]`);
        if (!view) {
          return;
        }
        const target = view.querySelector('h1, h2, h3, [role="log"]') || view;
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus();
      });
    });

    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
    };
  }, [location.pathname, isPreviewMode]);

  return (
    <div ref={containerRef} className='wpchat:relative wpchat:h-full'>
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route
            path='/'
            element={
              <PageLayout route='/'>
                <Home />
              </PageLayout>
            }
          />
          <Route
            path='/chat'
            element={
              <PageLayout route='/chat'>
                <Chat />
              </PageLayout>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
