import React from 'react';
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
  return (
    <div className='wpchat:relative wpchat:h-full'>
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route
            path='/'
            element={
              <PageLayout>
                <Home />
              </PageLayout>
            }
          />
          <Route
            path='/chat'
            element={
              <PageLayout>
                <Chat />
              </PageLayout>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
