import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  FolderTree, 
  Tag, 
  Layers, 
  Users, 
  ShieldCheck, 
  Key, 
  Image, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    attributes: 0,
    users: 0,
    media: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [prodRes, catRes, brandRes, attrRes, userRes, mediaRes] = await Promise.allSettled([
          axiosInstance.get('/products'),
          axiosInstance.get('/categories'),
          axiosInstance.get('/brands'),
          axiosInstance.get('/attributes'),
          axiosInstance.get('/users'),
          axiosInstance.get('/media')
        ]);

        setStats({
          products: prodRes.status === 'fulfilled' ? (prodRes.value.data.data?.length || prodRes.value.data.data?.products?.length || 0) : 0,
          categories: catRes.status === 'fulfilled' ? (catRes.value.data.data?.length || 0) : 0,
          brands: brandRes.status === 'fulfilled' ? (brandRes.value.data.data?.length || 0) : 0,
          attributes: attrRes.status === 'fulfilled' ? (attrRes.value.data.data?.length || 0) : 0,
          users: userRes.status === 'fulfilled' ? (userRes.value.data.data?.length || 0) : 0,
          media: mediaRes.status === 'fulfilled' ? (mediaRes.value.data.data?.length || 0) : 0
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const statCards = [
    { title: 'Products', count: stats.products, icon: Package, href: '/products', color: 'bg-blue-50 text-blue-600' },
    { title: 'Categories', count: stats.categories, icon: FolderTree, href: '/categories', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Brands', count: stats.brands, icon: Tag, href: '/brands', color: 'bg-purple-50 text-purple-600' },
    { title: 'Attributes', count: stats.attributes, icon: Layers, href: '/attributes', color: 'bg-amber-50 text-amber-600' },
    { title: 'Users', count: stats.users, icon: Users, href: '/users', color: 'bg-rose-50 text-rose-600' },
    { title: 'Media Library', count: stats.media, icon: Image, href: '/media', color: 'bg-indigo-50 text-indigo-600' },
  ];

  const quickActions = [
    { name: 'Add New Product', href: '/products/new', icon: PlusCircle, description: 'Create product with variants and gallery' },
    { name: 'Manage Categories', href: '/categories', icon: FolderTree, description: 'Organize category tree structure' },
    { name: 'Manage Users & Roles', href: '/users', icon: Users, description: 'User permissions and role assignments' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-canvas border border-border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-ink-muted font-mono font-semibold">Overview</span>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-ink mt-1">
            Welcome back, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-sm text-ink-muted mt-1 max-w-xl">
            Here is your TrendCommerce store management dashboard. Control your catalog, categories, attributes, and user permissions from one place.
          </p>
        </div>
        <Link
          to="/products/new"
          className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-pill hover:bg-ink/90 transition-colors shrink-0 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Metrics Grid */}
      <div>
        <h2 className="text-lg font-display font-semibold text-ink mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Store Analytics Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.href}
                className="bg-canvas border border-border p-5 rounded-xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4">
                  <p className="text-caption text-ink-muted">{item.title}</p>
                  <p className="text-display-sm font-display text-ink font-bold mt-0.5">
                    {loading ? '...' : item.count}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-canvas border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-ink mb-4">Quick Management Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 hover:bg-canvas-parchment hover:border-border transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-primary transition-colors">{action.name}</p>
                      <p className="text-caption text-ink-muted">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Security & System Status */}
        <div className="bg-canvas border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Security & Access Control
            </h2>
            <div className="space-y-4 text-sm text-ink-muted">
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas-parchment border border-border/50">
                <span className="font-medium text-ink">Role</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Super Admin
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas-parchment border border-border/50">
                <span className="font-medium text-ink">API Status</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operational (Port 5000)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas-parchment border border-border/50">
                <span className="font-medium text-ink">Database</span>
                <span className="text-xs text-ink font-semibold">PostgreSQL (Prisma ORM v7)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <Link to="/roles" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Manage Roles & Permissions
            </Link>
            <span className="text-caption text-ink-muted">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
