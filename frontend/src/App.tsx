import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import EmpresasPage from './pages/EmpresasPage';
import ProyectosPage from './pages/ProyectosPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="empresas/:empresaId/proyectos" element={<ProyectosPage />} />
      </Route>
    </Routes>
  );
}

export default App;
