import { Route } from 'react-router-dom';
import Home from '../Home';
import ReportGenerator from '../ReportGenerator';
import LCP from '../LCP';

// Base path for GitHub Pages
export const BASE_PATH = '/Ishowpagespeed';

// Define all application routes here
export const routes = [
  {
    index: true,
    path: `${BASE_PATH}/`,
    element: <Home />,
  },
  {
    path: `${BASE_PATH}/report-generator`,
    element: <ReportGenerator />,
  },
  {
    path: `${BASE_PATH}/lcp-calculator`,
    element: <LCP />,
  },
  // Add new routes here in the future
];

// Helper function to generate Route components
export const generateRoutes = (routes) => {
  return routes.map((route, i) => (
    <Route
      key={i}
      index={route.index}
      path={route.path}
      element={route.element}
    />
  ));
};
