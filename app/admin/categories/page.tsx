'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '', isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const cats: Category[] = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name || !newCat.slug) return;
    try {
      await addDoc(collection(db, 'categories'), {
        ...newCat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewCat({ name: '', slug: '', isActive: true });
      setIsCreating(false);
      fetchCategories();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'categories');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Category>) => {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      setEditingId(null);
      fetchCategories();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00]">Categorias</h1>
          <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Gerencie as categorias de produtos</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-[#FF4D00] text-[#09090B] font-black uppercase text-xs tracking-widest px-4 py-3 hover:bg-white transition-colors"
        >
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white/5 p-6 border-2 border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Nome</label>
              <input 
                type="text" 
                value={newCat.name}
                onChange={(e) => {
                  setNewCat({ ...newCat, name: e.target.value, slug: generateSlug(e.target.value) });
                }}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Slug</label>
              <input 
                type="text" 
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input 
                type="checkbox" 
                id="isActive"
                checked={newCat.isActive}
                onChange={(e) => setNewCat({ ...newCat, isActive: e.target.checked })}
                className="accent-[#FF4D00] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Ativo</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold uppercase text-xs py-2">Salvar</button>
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs py-2">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FF4D00]" size={32} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-white/20">
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Nome</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Slug</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50">Status</th>
                <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-white/50 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/40 text-sm font-bold uppercase tracking-widest">Nenhuma categoria encontrada.</td>
                </tr>
              ) : categories.map(cat => (
                <tr key={cat.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-4 font-bold">{cat.name}</td>
                  <td className="py-4 px-4 text-white/60">{cat.slug}</td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => handleUpdate(cat.id, { isActive: !cat.isActive })}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                    >
                      {cat.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-4 px-4 flex justify-end gap-2">
                    <button onClick={() => handleDelete(cat.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
