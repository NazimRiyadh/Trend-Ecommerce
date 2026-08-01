import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  LayoutDashboard, 
  ShieldCheck, 
  Key, 
  Users, 
  Image, 
  FolderTree, 
  Tag, 
  Layers, 
  Package 
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, role, logout, hasPermission } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', permission: 'dashboard:watch', icon: LayoutDashboard },
    { name: 'Products', href: '/products', permission: 'product:watch', icon: Package },
    { name: 'Categories', href: '/categories', permission: 'category:watch', icon: FolderTree },
    { name: 'Brands', href: '/brands', permission: 'brand:watch', icon: Tag },
    { name: 'Attributes', href: '/attributes', permission: 'attribute:watch', icon: Layers },
    { name: 'Media Library', href: '/media', permission: 'media:watch', icon: Image },
    { name: 'Users', href: '/users', permission: 'user:watch', icon: Users },
    { name: 'Roles', href: '/roles', permission: 'role:watch', icon: Key },
    { name: 'Permissions', href: '/permissions', permission: 'permission:watch', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-canvas-parchment flex flex-col font-body">
      {/* Global Top Navbar */}
      <header className="h-14 bg-ink text-white flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-display font-bold text-white text-xs">
            TC
          </div>
          <Link to="/" className="font-display font-bold text-base tracking-tight text-white hover:opacity-90 transition-opacity">
            TrendCommerce <span className="text-xs font-normal text-white/50 ml-1">Admin</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-white/80 font-medium">{user?.name || 'Admin User'}</span>
            {role?.name && (
              <span className="bg-white/10 text-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-white/10">
                {role.name}
              </span>
            )}
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="h-8 text-white/70 hover:text-white hover:bg-white/10 px-2.5 rounded-pill text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-canvas border-r border-border overflow-y-auto shrink-0 py-6 px-3">
          <div className="px-3 mb-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Navigation
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              if (item.permission && !hasPermission(item.permission)) return null;
              
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive 
                      ? 'bg-ink text-white shadow-sm font-semibold' 
                      : 'text-ink hover:bg-canvas-parchment hover:text-primary'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-canvas-parchment p-6 sm:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
