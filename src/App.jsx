import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { routes, generateRoutes } from './routes/Routes.jsx';
import Layout from './Layout';
import './App.css';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {generateRoutes(routes)}
        </Routes>
      </Layout>
    </Router>
  );
}
