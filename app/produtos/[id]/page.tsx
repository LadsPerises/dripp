'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Star, ChevronLeft, ChevronRight, Package, Truck, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useCart } from '../../../lib/CartContext';
import AuthButton from '../../../components/AuthButton';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showCartAdded, setShowCartAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (product?.images?.length) {
      setCurrentImageIdx((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length) {
      setCurrentImageIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] });
      setShowCartAdded(true);
      setTimeout(() => setShowCartAdded(false), 2000);
    }
  };

  // Mock Reviews
  const reviews = [
    { id: 1, user: "Alex M.", rating: 5, date: "2 dias atrás", text: "Qualidade absurda! O tecido é muito premium e o caimento ficou perfeito. Comprarei mais vezes com certeza." },
    { id: 2, user: "Sofia R.", rating: 4, date: "1 semana atrás", text: "Gostei muito, chegou bem rápido e bem embalado. Só achei o tamanho um pouco menor do que o esperado, mas a loja resolveu rápido." },
    { id: 3, user: "João P.", rating: 5, date: "3 semanas atrás", text: "Simplesmente incrível! Design único que não se acha em qualquer lugar. Vale cada cêntimo." }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex justify-center items-center">
        <span className="block w-12 h-12 rounded-full border-4 border-t-[#FF4D00] border-r-[#FF4D00] border-b-transparent border-l-transparent animate-spin"></span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-white pb-20">
        <h1 className="text-4xl font-black mb-4 uppercase">Produto Não Encontrado</h1>
        <Link href="/produtos" className="px-8 py-3 bg-[#FF4D00] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#09090B] border border-transparent hover:border-[#FF4D00] transition-colors">
          Voltar à Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Navbar Minimalista */}
      <nav className="border-b border-white/10 bg-[#121214]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/produtos" className="hover:text-[#FF4D00] transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="flex gap-6 items-center">
            <AuthButton />
            <Link href="/produtos" className="relative group cursor-pointer text-white hover:text-[#FF4D00] transition-colors">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF4D00] text-white text-[10px] w-4 h-4 flex justify-center items-center rounded-full font-black">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative">
        
        {/* Left Column: Image Carousel */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/5] bg-[#18181B] border border-white/10 overflow-hidden group w-full">
            {product.images && product.images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIdx}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image 
                    src={product.images[currentImageIdx]} 
                    alt={product.name} 
                    fill 
                    className="object-cover object-center" 
                    referrerPolicy="no-referrer"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white/20">
                <Package size={64} />
              </div>
            )}

            {/* Carousel Controls */}
            {product.images && product.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#09090B]/50 hover:bg-[#FF4D00] text-white flex items-center justify-center rounded-full backdrop-blur transition-all disabled:opacity-30 disabled:hover:bg-[#09090B]/50"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#09090B]/50 hover:bg-[#FF4D00] text-white flex items-center justify-center rounded-full backdrop-blur transition-all disabled:opacity-30 disabled:hover:bg-[#09090B]/50"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIdx ? 'bg-[#FF4D00] w-6' : 'bg-white/50 hover:bg-white'} `}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`relative w-24 aspect-[4/5] shrink-0 border-2 transition-all overflow-hidden ${idx === currentImageIdx ? 'border-[#FF4D00]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details */}
        <div className="flex flex-col">
          {product.stock <= 5 && product.stock > 0 && (
             <p className="text-[#FF4D00] text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse"></span>
               Últimas {product.stock} unidades em stock
             </p>
          )}

          <h1 className="text-4xl lg:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
            <span className="text-3xl font-black">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</span>
            <div className="flex items-center text-[#FF4D00]">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" className="opacity-50" />
              <span className="text-white/50 text-xs ml-2 font-bold">(24)</span>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Escolha o Tamanho</h3>
            <div className="flex flex-wrap gap-3">
              {['P', 'M', 'G', 'GG'].map((size) => (
                <button key={size} className="w-14 h-14 border border-white/20 hover:border-[#FF4D00] hover:text-[#FF4D00] flex items-center justify-center font-bold transition-all bg-[#09090B]">
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={showCartAdded || product.stock === 0}
            className={`w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-[0_20px_40px_rgba(255,77,0,0.15)] hover:shadow-[0_20px_40px_rgba(255,77,0,0.3)] hover:-translate-y-1 mb-8 ${showCartAdded ? 'bg-green-500 text-[#09090B]' : 'bg-[#FF4D00] text-white hover:bg-[#EE4B00]'} border border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showCartAdded ? (
              <><CheckCircle2 size={20} /> Adicionado ao Carrinho</>
            ) : product.stock === 0 ? (
               "Esgotado"
            ) : (
              <><ShoppingCart size={20} /> Adicionar ao Carrinho</>
            )}
          </button>

          {/* Quick Perks */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="flex items-start gap-3 bg-[#18181B] p-4 border border-white/5">
              <Truck className="text-[#FF4D00] shrink-0" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1">Envio Expresso</p>
                <p className="text-[10px] text-white/50 leading-relaxed">Entregas em até 24h para Maputo City e Matola.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#18181B] p-4 border border-white/5">
              <ShieldCheck className="text-[#FF4D00] shrink-0" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1">Qualidade Premium</p>
                <p className="text-[10px] text-white/50 leading-relaxed">Materiais importados com selo de autenticidade.</p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border border-white/10 bg-[#18181B]">
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setActiveTab('desc')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'desc' ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'}`}
              >
                Descrição
              </button>
              <button 
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'specs' ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'}`}
              >
                Detalhes
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'reviews' ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'}`}
              >
                Reviews (24)
              </button>
            </div>
            
            <div className="p-6 md:p-8 min-h-[200px]">
              {activeTab === 'desc' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert prose-sm max-w-none">
                  <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </motion.div>
              )}
              
              {activeTab === 'specs' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Material</span>
                    <span className="text-sm font-medium text-right">100% Algodão Premium</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Modelagem</span>
                    <span className="text-sm font-medium text-right">Oversized / Drop Shoulder</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Origem</span>
                    <span className="text-sm font-medium text-right">Produzido localmente, <br/>padrões globais</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm tracking-wide">{review.user}</p>
                          <div className="flex text-[#FF4D00] mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{review.date}</span>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed mt-3">{review.text}</p>
                    </div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all font-bold uppercase tracking-widest text-xs mt-4">
                    Carregar Mais
                  </button>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
