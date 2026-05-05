'use client';

import { useAuth } from '@/lib/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Truck, LogOut, Loader2, Navigation, PackageCheck } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isDriver } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isDriver)) {
      router.push('/');
    }
  }, [user, loading, isDriver, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-blue-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-white/50">Verificando acessos logísticos...</p>
      </div>
    );
  }

  if (!user || !isDriver) {
    return null; // Will redirect
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const navItems = [
    { name: 'Minhas Entregas', href: '/driver', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#121214] flex flex-col md:flex-row text-white font-sans selection:bg-blue-500/30 selection:text-blue-500">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111] border-b md:border-b-0 md:border-r-2 border-white/10 flex flex-col">
        <div className="p-6 border-b-2 border-white/10 bg-[#09090B]/50">
          <Link href="/" className="text-2xl font-black uppercase tracking-tighter text-blue-500 flex items-center gap-2">
            <Navigation size={24} />
            Entregador
          </Link>
          <p className="mt-2 text-[10px] font-bold tracking-widest uppercase text-white/40 truncate">{user.email}</p>
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
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t-2 border-white/10 bg-[#09090B]/50">
           <Link href="/orders" className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg font-bold uppercase tracking-widest text-xs text-white/70 hover:bg-white/5 transition-colors">
              <PackageCheck size={18} />
              Meus Pedidos (Cliente)
           </Link>
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
      <main className="flex-1 p-6 md:p-10 overflow-auto bg-gradient-to-br from-[#121214] to-[#111]">
        {children}
      </main>
    </div>
  );
}
