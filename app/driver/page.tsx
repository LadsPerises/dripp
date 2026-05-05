'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { useAuth } from '@/lib/useAuth';
import { Loader2, Navigation2, CheckCircle, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  items: any[];
  totalAmount: number;
  driverId?: string;
  deliveryAddress?: string;
  contactNumber?: string;
  deliveryDate?: string;
  createdAt: any;
  updatedAt: any;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query orders assigned to this driver
      // Firestore index may be required for complex rules, so we'll fetch accepted, in_transit, delivered separately if needed,
      // but if the driverId is ours, we can get all of them.
      const q = query(
        collection(db, 'orders'), 
        where('driverId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
         fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);
    } catch (e: any) {
      if (e.message.includes('requires an index')) {
          console.warn("Index required. Fetching simply for now and filtering locally.");
          try {
             // Fallback query without sorting (needs index)
             const fallbackQ = query(collection(db, 'orders'), where('driverId', '==', user.uid));
             const fallbackSnap = await getDocs(fallbackQ);
             const fallBackOrders: Order[] = [];
             fallbackSnap.forEach(doc => fallBackOrders.push({ id: doc.id, ...doc.data() } as Order));
             setOrders(fallBackOrders.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
          } catch(e2) {
              handleFirestoreError(e2, OperationType.GET, 'orders');
          }
      } else {
        handleFirestoreError(e, OperationType.GET, 'orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdateStatus(null);
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
      setUpdateStatus({ type: 'success', message: "Status de entrega atualizado com sucesso." });
      setTimeout(() => setUpdateStatus(null), 3000);
      fetchOrders();
    } catch (e: any) {
      setUpdateStatus({ type: 'error', message: "Erro ao atualizar pedido: " + e.message });
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-1 text-[10px] font-black uppercase flex items-center gap-2 w-fit"><PackageCheck size={14}/> Aguardando Retirada</span>;
      case 'in_transit': return <span className="bg-purple-500/10 border border-purple-500/30 text-purple-500 px-3 py-1 text-[10px] font-black uppercase flex items-center gap-2 w-fit"><Truck size={14}/> Em Rota</span>;
      case 'delivered': return <span className="bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-1 text-[10px] font-black uppercase flex items-center gap-2 w-fit"><CheckCircle size={14}/> Finalizado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-blue-500 flex items-center gap-3">
          Minhas Entregas
        </h1>
        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Visão geral dos pedidos atribuídos a si</p>
      </div>

      <AnimatePresence>
        {updateStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 border text-sm font-bold uppercase tracking-widest flex items-center gap-3 ${updateStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
          >
            {updateStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {updateStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/10">
              <Navigation2 size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Nenhuma entrega atribuída no momento.</p>
            </div>
          ) : orders.map(order => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-white/10 p-6 flex flex-col md:flex-row gap-6 hover:border-blue-500/30 transition-colors relative overflow-hidden"
            >
              {order.status === 'in_transit' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
              {order.status === 'delivered' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}
              
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-tight uppercase font-mono tracking-widest text-white mb-1 blur-[0.5px]">#{order.id.slice(0,8)}</h3>
                    <p className="text-xs font-bold uppercase text-white/50">Criado: {new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleString()}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] mb-2">Destino de Entrega</h4>
                  <p className="text-sm font-bold opacity-80"><span className="text-white/50 text-xs">Endereço:</span> {order.deliveryAddress || 'N/A'}</p>
                  <p className="text-sm font-bold opacity-80"><span className="text-white/50 text-xs">Contato:</span> {order.contactNumber || 'N/A'}</p>
                  {order.deliveryDate && <p className="text-sm font-bold text-green-500 uppercase tracking-widest mt-1">Data Agendada: <span className="text-white font-mono">{order.deliveryDate}</span></p>}
                </div>
                
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Itens Transportados</h4>
                  <div className="bg-[#09090B]/50 p-4 border border-white/5 space-y-2">
                    {order.items?.map((item: any, idx: number) => (
                       <div key={idx} className="flex justify-between text-xs font-bold opacity-80 uppercase tracking-wide">
                          <span>{item.quantity}x {item.name}</span>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 justify-center bg-[#09090B]/20 md:bg-transparent -mx-6 md:mx-0 px-6 md:px-0">
                 
                 {order.status === 'accepted' && (
                     <div className="space-y-4">
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                          className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-4 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <Navigation2 size={16} />
                          Iniciar Rota
                        </button>
                     </div>
                 )}
                 {order.status === 'in_transit' && (
                     <div className="space-y-4">
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full bg-green-600 text-white font-black uppercase tracking-widest text-xs py-4 px-2 hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Confirmar Entrega
                        </button>
                     </div>
                 )}
                 {order.status === 'delivered' && (
                    <div className="flex flex-col items-center justify-center py-4 text-green-500/50">
                       <CheckCircle size={32} className="mb-2" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Entrega Concluída</span>
                    </div>
                 )}
                 {order.status === 'cancelled' && (
                    <div className="flex flex-col items-center justify-center py-4 text-red-500/50">
                       <AlertCircle size={32} className="mb-2" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Pedido Cancelado</span>
                    </div>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
