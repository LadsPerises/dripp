'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { ShoppingBag, Loader2, CheckCircle, Truck, XCircle, Clock } from 'lucide-react';

// ... Add deliveryDate to Order interface
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

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);

      // Fetch drivers and users
      const usersQ = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQ);
      const drvs: UserProfile[] = [];
      const uMap: Record<string, UserProfile> = {};
      
      usersSnap.forEach((doc) => {
        const u = { id: doc.id, ...doc.data() } as UserProfile;
        uMap[doc.id] = u;
        if (u.role === 'driver') {
          drvs.push(u);
        }
      });
      setDrivers(drvs);
      setUsersInfo(uMap);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, driverId?: string, deliveryDate?: string) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      const updates: any = { status, updatedAt: serverTimestamp() };
      if (driverId !== undefined && driverId !== "") {
        updates.driverId = driverId;
      }
      if (deliveryDate) {
        updates.deliveryDate = deliveryDate;
      }
      await updateDoc(docRef, updates);
      
      if (status === 'accepted') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
           const email = usersInfo[order.userId]?.email;
           if (email) {
             // Mock email sending integration
             await fetch('/api/send-email', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 to: email, 
                 subject: "Pedido Aceite! - Dripp Store", 
                 text: `Seu pedido #${orderId} foi aceite pela nossa equipa e está a ser preparado.`
               })
             }).catch(console.error);
             setUpdateStatus(`Pedido Aceite e Notificação de e-mail enviada para ${email}`);
           }
        }
      } else {
        setUpdateStatus("Status do pedido atualizado.");
      }
      
      setTimeout(() => setUpdateStatus(null), 4000);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Clock size={12}/> Pendente</span>;
      case 'accepted': return <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle size={12}/> Aceite</span>;
      case 'in_transit': return <span className="bg-purple-500/20 text-purple-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Truck size={12}/> Em Trânsito</span>;
      case 'delivered': return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle size={12}/> Entregue</span>;
      case 'cancelled': return <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><XCircle size={12}/> Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00]">Pedidos</h1>
        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Gerencie os pedidos dos clientes</p>
      </div>

      {updateStatus && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded text-sm font-bold uppercase tracking-widest">
          {updateStatus}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FF4D00]" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.length === 0 ? (
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest py-10 text-center">Nenhum pedido encontrado.</p>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white/5 border border-white/10 p-6 flex flex-col md:flex-row gap-6 hover:border-white/30 transition-colors">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-tight uppercase font-mono tracking-widest text-white/50">#{order.id.slice(0,8)}</h3>
                    <p className="text-sm font-bold uppercase">Cliente: <span className="text-[#FF4D00]">{usersInfo[order.userId]?.email || order.userId}</span></p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Itens ({order.items?.length || 0})</h4>
                  {order.items?.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono">{(item.price * (item.quantity||1)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                     </div>
                  ))}
                  <div className="flex items-center justify-between font-black pt-2 text-[#FF4D00]">
                    <span>TOTAL</span>
                    <span>{order.totalAmount?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                  </div>
                </div>

                {/* Delivery details display */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00]">Detalhes de Entrega</h4>
                   <p className="text-sm font-bold opacity-80"><span className="text-white/50 text-xs">Destino:</span> {order.deliveryAddress || 'N/A'}</p>
                   <p className="text-sm font-bold opacity-80"><span className="text-white/50 text-xs">Contatos:</span> {order.contactNumber || 'N/A'}</p>
                   {order.deliveryDate && <p className="text-sm font-bold text-green-500 uppercase tracking-widest mt-1">Data Agendada: <span className="text-white font-mono">{order.deliveryDate}</span></p>}
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                 <h4 className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">Ações</h4>
                 
                 {order.status === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Selecionar Entregador</label>
                        <select 
                          id={`driver-${order.id}`}
                          className="w-full bg-[#09090B] border border-white/20 px-3 py-2 outline-none focus:border-[#FF4D00] text-sm font-bold opacity-80"
                        >
                          <option value="">Nenhum entregador</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Data de Entrega</label>
                        <input 
                          type="date"
                          id={`date-${order.id}`}
                          className="w-full bg-[#09090B] border border-white/20 px-3 py-2 outline-none focus:border-[#FF4D00] text-[10px] font-mono uppercase text-white/80"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const select = document.getElementById(`driver-${order.id}`) as HTMLSelectElement;
                          const dateInput = document.getElementById(`date-${order.id}`) as HTMLInputElement;
                          if (!dateInput.value) {
                             alert("Defina a data de entrega.");
                             return;
                          }
                          handleUpdateStatus(order.id, 'accepted', select.value, dateInput.value);
                        }}
                        className="w-full bg-[#FF4D00] text-[#09090B] font-black uppercase tracking-widest text-xs py-3 hover:bg-white transition-colors"
                      >
                        Aceitar Pedido
                      </button>
                      <button 
                         onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                         className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs py-3 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                 )}

                 {order.status === 'accepted' && (
                     <div className="space-y-4">
                        <div className="text-sm font-bold opacity-80 uppercase">
                          <span className="text-white/50 text-[10px]">Entregador:</span><br/>
                          {order.driverId ? (usersInfo[order.driverId]?.email || order.driverId) : 'Nenhum'}
                        </div>
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                          className="w-full bg-purple-600 text-white font-black uppercase tracking-widest text-xs py-3 hover:bg-purple-500 transition-colors"
                        >
                          Marcar Trânsito
                        </button>
                     </div>
                 )}
                 {order.status === 'in_transit' && (
                     <div className="space-y-4">
                        <div className="text-sm font-bold opacity-80 uppercase">
                          <span className="text-white/50 text-[10px]">Entregador:</span><br/>
                          {order.driverId ? (usersInfo[order.driverId]?.email || order.driverId) : 'Nenhum'}
                        </div>
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="w-full bg-green-600 text-white font-black uppercase tracking-widest text-xs py-3 hover:bg-green-500 transition-colors"
                        >
                          Marcar Entregue
                        </button>
                     </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
