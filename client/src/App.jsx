import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import PermissionPage from './pages/PermissionPage';
import RolePage from './pages/RolePage';
import UserPage from './pages/UserPage';
import MediaPage from './pages/MediaPage';
import CategoryPage from './pages/CategoryPage';
import BrandPage from './pages/BrandPage';
import AttributePage from './pages/AttributePage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import DashboardHomePage from './pages/DashboardHomePage';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHomePage />} />
          <Route path="permissions" element={<PermissionPage />} />
          <Route path="roles" element={<RolePage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="brands" element={<BrandPage />} />
          <Route path="attributes" element={<AttributePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
