import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import EmpresasPage from './pages/EmpresasPage';
import ProyectosPage from './pages/ProyectosPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública de inicio de sesión (Req 7.4). */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas: el Guardia_Ruta exige un token válido y, en su
            ausencia, redirige a `/login` (Req 7.1, 7.2). */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="empresas/:empresaId/proyectos" element={<ProyectosPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
