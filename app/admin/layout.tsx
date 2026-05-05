'use client';

import { useAuth } from '@/lib/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Tags, Users, LogOut, Loader2, ShoppingBag } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center text-[#FF4D00]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Produtos', href: '/admin/products', icon: Package },
    { name: 'Categorias', href: '/admin/categories', icon: Tags },
    { name: 'Usuários', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#121214] flex flex-col md:flex-row text-white font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#09090B] border-b md:border-b-0 md:border-r-2 border-white/10 flex flex-col">
        <div className="p-6 border-b-2 border-white/10">
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter text-[#FF4D00]">
            Syndicate<span className="text-white">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors ${
                  isActive ? 'bg-[#FF4D00] text-[#09090B]' : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t-2 border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-white/70 hover:bg-white/5 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
