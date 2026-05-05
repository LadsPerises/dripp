'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { Shield, Trash2, Loader2, User, Save, X, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'driver';
  createdAt: any;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin' | 'driver'>('customer');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usrs: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usrs.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usrs);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRole(user.role || 'customer');
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    setUpdateStatus(null);
    try {
      const docRef = doc(db, 'users', editingUser.id);
      await updateDoc(docRef, { role: selectedRole });
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
      setUpdateStatus({ type: 'success', message: "Permissões atualizadas com sucesso!" });
      setTimeout(() => setUpdateStatus(null), 3000);
      setEditingUser(null);
    } catch (e: any) {
      console.error(e);
      setUpdateStatus({ type: 'error', message: "Erro ao modificar acesso: " + e.message });
      handleFirestoreError(e, OperationType.UPDATE, `users/${editingUser.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    // using window.confirm is bad in iframes, but since the user asks for managers and drivers, we can create a nice interface.
    // We will just disable delete for now or use a custom prompt if needed, but let's focus on roles.
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00]">Acessos</h1>
        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Gerencie permissões de gestores, entregadores e clientes</p>
      </div>

      {updateStatus && (
        <div className={`p-4 rounded text-sm font-bold uppercase tracking-widest ${updateStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
          {updateStatus.message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FF4D00]" size={32} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-white/20">
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Usuário</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Nome</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Email</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Cargo Atual</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40 text-sm font-bold uppercase tracking-widest">Nenhum usuário encontrado.</td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <span className="font-mono text-xs text-white/50">{user.id.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold">{user.name || '-'}</td>
                  <td className="py-4 px-4 font-bold max-w-[200px] truncate">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                        user.role === 'admin' ? 'text-[#FF4D00] bg-[#FF4D00]/10' : 
                        user.role === 'driver' ? 'text-blue-500 bg-blue-500/10' : 'text-white/60 bg-white/5'
                      }`}>
                      {user.role === 'admin' && <Shield size={12} />}
                      {user.role === 'admin' ? 'Gestor' : user.role === 'driver' ? 'Entregador' : 'Cliente'}
                    </span>
                  </td>
                  <td className="py-4 px-4 flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(user)} 
                      className="p-2 bg-white/5 text-white hover:bg-white/20 transition-colors uppercase text-xs font-bold tracking-widest flex items-center gap-2" 
                      title="Editar Acessos">
                      <Edit size={14} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição */}
      <AnimatePresence>
        {editingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 w-full max-w-md p-6 relative"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">Modificar Acessos</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-1">Usuário</p>
                  <p className="font-bold text-white truncate">{editingUser.email}</p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2 block">Selecione o novo cargo</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setSelectedRole('customer')}
                      className={`p-3 text-left border text-sm font-bold uppercase tracking-widest transition-colors ${selectedRole === 'customer' ? 'border-white bg-white/10 text-white' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                    >
                      Cliente
                    </button>
                    <button
                      onClick={() => setSelectedRole('driver')}
                      className={`p-3 text-left border text-sm font-bold uppercase tracking-widest transition-colors ${selectedRole === 'driver' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                    >
                      Entregador (App/Logística)
                    </button>
                    <button
                      onClick={() => setSelectedRole('admin')}
                      className={`p-3 text-left border text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${selectedRole === 'admin' ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]' : 'border-white/20 text-white/50 hover:border-white/50'}`}
                    >
                      <span>Gestor (Admin)</span>
                      {selectedRole === 'admin' && <Shield size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#FF4D00] text-white text-xs font-black uppercase tracking-widest hover:bg-[#09090B] hover:text-[#FF4D00] border border-transparent hover:border-[#FF4D00] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

