'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { ShoppingBag, Loader2, CheckCircle, Truck, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  items: any[];
  totalAmount: number;
  deliveryAddress?: string;
  contactNumber?: string;
  deliveryDate?: string;
  createdAt: any;
  updatedAt: any;
}

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        snapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(fetchedOrders);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2"><Clock size={14}/> Pendente de Aprovação</span>;
      case 'accepted': return <span className="bg-blue-500/20 text-blue-500 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2"><CheckCircle size={14}/> Pedido Aceite - Em Preparação</span>;
      case 'in_transit': return <span className="bg-purple-500/20 text-purple-500 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2"><Truck size={14}/> Em Trânsito para Entrega</span>;
      case 'delivered': return <span className="bg-green-500/20 text-green-500 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2"><CheckCircle size={14}/> Entregue</span>;
      case 'cancelled': return <span className="bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-2"><XCircle size={14}/> Cancelado</span>;
      default: return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center text-[#FF4D00]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00] mb-4">Acesso Negado</h1>
        <p className="text-white/60 mb-8 max-w-sm">Entre na sua conta para acompanhar o estado dos seus pedidos.</p>
        <Link href="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-[#FF4D00] hover:text-[#09090B] transition-colors px-6 py-3 rounded-full">
          <ArrowLeft size={16} /> Voltar à Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans relative overflow-hidden">
      <nav className="w-full p-6 md:p-10 z-10 flex justify-between items-center relative max-w-[1400px] mx-auto border-b border-white/10">
        <Link href="/" className="flex items-center space-x-3 md:space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FF4D00] rounded-full flex items-center justify-center">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-[#09090B] rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase">Dripp Store</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-10 relative z-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">Meus <span className="text-[#FF4D00]">Pedidos</span></h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
             <ShoppingBag size={48} className="mx-auto text-white/20 mb-4" />
             <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Sem pedidos</h2>
             <p className="text-sm text-white/50 mb-6">Ainda não realizaste nenhuma compra connosco.</p>
             <Link href="/" className="inline-block bg-[#FF4D00] text-[#09090B] font-black uppercase tracking-widest text-xs px-8 py-3 hover:bg-white transition-colors">
               Explorar Produtos
             </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-xl relative overflow-hidden group hover:border-[#FF4D00]/50 transition-colors">
                
                {/* Decorative glowing gradient effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D00]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6 relative z-10">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-1">Pedido <span className="text-white">#{order.id.slice(0,12)}</span></h3>
                    <p className="text-xs font-bold text-white/60">
                      {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString('pt-PT') : 'A processar...'}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-2">
                    <div className="bg-[#09090B]/30 p-4 rounded-lg border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Destino</h4>
                      <p className="text-sm font-bold truncate" title={order.deliveryAddress || 'N/A'}>{order.deliveryAddress || 'N/A'}</p>
                    </div>
                    {order.deliveryDate ? (
                      <div className="bg-[#09090B]/30 p-4 rounded-lg border border-green-500/20 text-green-500">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500/50 mb-2">Data Agendada</h4>
                        <p className="text-sm font-mono font-bold tracking-wider">{order.deliveryDate}</p>
                      </div>
                    ) : (
                      <div className="bg-[#09090B]/30 p-4 rounded-lg border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] mb-2">Data Agendada</h4>
                        <p className="text-xs font-bold text-white/50 truncate">Aguardando confirmação do gestor.</p>
                      </div>
                    )}
                  </div>

                  {order.items?.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center bg-[#09090B]/30 p-4 rounded-lg border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/5 rounded flex bg-center bg-cover border border-white/10" style={item.image ? {backgroundImage: `url(${item.image})`} : {}}>
                             {!item.image && <ShoppingBag className="m-auto text-white/20" size={20}/>}
                           </div>
                           <div>
                             <p className="font-bold text-sm uppercase tracking-wide">{item.name}</p>
                             <p className="text-[10px] text-white/50 uppercase font-black">Quantidade: {item.quantity || 1}</p>
                           </div>
                        </div>
                        <span className="font-mono text-sm">{(item.price * (item.quantity||1)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                     </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                  <span className="text-sm font-bold uppercase tracking-widest text-white/50">Total do Pedido</span>
                  <span className="text-2xl font-black text-[#FF4D00]">{order.totalAmount?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
