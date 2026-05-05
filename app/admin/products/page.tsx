'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { Plus, Edit2, Trash2, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  isPublished: boolean;
  stock: number;
  createdAt: any;
  updatedAt: any;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [newProd, setNewProd] = useState({ name: '', description: '', price: 0, categoryId: '', images: '' as any, isPublished: false, stock: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const pQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const pSnap = await getDocs(pQ);
      const prods: Product[] = [];
      pSnap.forEach((doc) => prods.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);

      const cQ = query(collection(db, 'categories'), orderBy('name'));
      const cSnap = await getDocs(cQ);
      const cats: Category[] = [];
      cSnap.forEach((doc) => cats.push({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.categoryId) return alert("Selecione uma categoria");
    try {
      const imagesList = newProd.images ? (typeof newProd.images === 'string' ? newProd.images.split(',').map((u: string) => u.trim()) : newProd.images) : [];
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          name: newProd.name,
          description: newProd.description,
          price: Number(newProd.price),
          categoryId: newProd.categoryId,
          images: imagesList,
          isPublished: newProd.isPublished,
          stock: Number(newProd.stock),
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          name: newProd.name,
          description: newProd.description,
          price: Number(newProd.price),
          categoryId: newProd.categoryId,
          images: imagesList,
          isPublished: newProd.isPublished,
          stock: Number(newProd.stock),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setEditingId(null);
      setNewProd({ name: '', description: '', price: 0, categoryId: '', images: '', isPublished: false, stock: 0 });
      setIsCreating(false);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, editingId ? OperationType.UPDATE : OperationType.CREATE, editingId ? `products/${editingId}` : 'products');
    }
  };

  const handleEdit = (prod: Product) => {
    setEditingId(prod.id);
    setNewProd({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      categoryId: prod.categoryId,
      images: prod.images ? prod.images.join(', ') : '',
      isPublished: prod.isPublished,
      stock: prod.stock
    });
    setIsCreating(true);
  };

  const handleTogglePublish = async (prod: Product) => {
    try {
      await updateDoc(doc(db, 'products', prod.id), {
        isPublished: !prod.isPublished,
        updatedAt: serverTimestamp()
      });
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${prod.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProductToDelete(null);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00]">Produtos</h1>
          <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Gerencie o seu catálogo</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewProd({ name: '', description: '', price: 0, categoryId: '', images: '', isPublished: false, stock: 0 });
            setIsCreating(true);
          }}
          className="flex items-center gap-2 bg-[#FF4D00] text-[#09090B] font-black uppercase text-xs tracking-widest px-4 py-3 hover:bg-white transition-colors"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="bg-white/5 p-6 border-2 border-white/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Nome</label>
              <input 
                type="text" 
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Categoria</label>
              <select 
                value={newProd.categoryId}
                onChange={(e) => setNewProd({ ...newProd, categoryId: e.target.value })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              >
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Descrição</label>
              <textarea 
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm h-24"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Preço (Kz)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Estoque</label>
              <input 
                type="number" 
                min="0"
                value={newProd.stock}
                onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">URLs das Imagens (separadas por vírgula)</label>
              <input 
                type="text" 
                value={newProd.images}
                onChange={(e) => setNewProd({ ...newProd, images: e.target.value })}
                className="w-full bg-[#09090B] border border-white/20 px-4 py-2 outline-none focus:border-[#FF4D00] text-sm placeholder:text-white/20"
                placeholder="https://picsum.photos/400, https://picsum.photos/401"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input 
                type="checkbox" 
                id="isPublished"
                checked={newProd.isPublished}
                onChange={(e) => setNewProd({ ...newProd, isPublished: e.target.checked })}
                className="accent-[#FF4D00] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Publicado na Loja</label>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-white/10 mt-4">
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-widest text-xs py-3 px-8 transition-colors">{editingId ? 'Atualizar Produto' : 'Salvar Produto'}</button>
            <button type="button" onClick={() => {
              setIsCreating(false);
              setEditingId(null);
            }} className="bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-xs py-3 px-8 transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FF4D00]" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest col-span-3 py-10 text-center">Nenhum produto cadastrado.</p>
          ) : products.map(prod => (
            <div key={prod.id} className="bg-white/5 border border-white/10 hover:border-white/30 transition-colors flex flex-col">
              <div className="h-48 bg-[#09090B] relative flex items-center justify-center overflow-hidden group">
                {prod.images && prod.images.length > 0 ? (
                  <img src={prod.images[0]} alt={prod.name} className="object-cover w-full h-full opacity-60 hover:opacity-100 transition-opacity" />
                ) : (
                  <ImageIcon size={48} className="text-white/20" />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${prod.isPublished ? 'bg-green-500 text-[#09090B]' : 'bg-red-500 text-white'}`}>
                    {prod.isPublished ? 'PUBLICADO' : 'RASCUNHO'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{prod.name}</h3>
                  <p className="font-black text-[#FF4D00] whitespace-nowrap ml-4">{prod.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Estoque: <span className="text-white">{prod.stock}</span></p>
                <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-white/10">
                  {productToDelete === prod.id ? (
                    <>
                      <span className="text-xs text-red-500 font-bold self-center mr-2 uppercase tracking-widest">Certeza?</span>
                      <button onClick={() => handleDelete(prod.id)} className="px-3 py-1 bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-colors">Sim</button>
                      <button onClick={() => setProductToDelete(null)} className="px-3 py-1 bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-colors">Não</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleTogglePublish(prod)} className="p-2 bg-white/10 text-white hover:bg-white hover:text-[#09090B] transition-colors" title={prod.isPublished ? "Despublicar" : "Publicar"}>
                        {prod.isPublished ? <X size={16} /> : <Check size={16} />}
                      </button>
                      <button onClick={() => handleEdit(prod)} className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] hover:bg-[#FF4D00] hover:text-white transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setProductToDelete(prod.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
