'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Copy, CheckCircle2, ShoppingBag, ArrowRight, Truck, ShieldCheck, Info, Clock, ShoppingCart, Minus, Plus, Trash2, Package } from 'lucide-react';
import AuthButton from '../components/AuthButton';
import { useAuth } from '../lib/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseError';
import Link from 'next/link';
import { useCart } from '../lib/CartContext';

export default function DrippStorePromo() {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 29, seconds: 59 });
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'success' | 'error' | null>(null);
  const [emailMessage, setEmailMessage] = useState('');
  const { cart, addToCart, updateQuantity: handleUpdateQuantity, removeItem: handleRemoveItem, cartTotal, clearCart } = useCart();
  const [showCartAdded, setShowCartAdded] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { getDocs, query, collection, where, limit, orderBy } = await import('firebase/firestore');
        const q = query(
          collection(db, 'products'),
          where('isPublished', '==', true),
          // orderBy('createdAt', 'desc'), // Removing for now if index missing
          limit(8)
        );
        const snap = await getDocs(q);
        const prods: any[] = [];
        snap.forEach(doc => {
          prods.push({ id: doc.id, ...doc.data() });
        });
        setProducts(prods);
      } catch (e) {
        console.error("Error fetching products", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);


  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleCheckout = async () => {
    if (!user) {
      setCheckoutStatus({ type: 'error', message: "Por favor, faça login para finalizar a compra." });
      return;
    }
    if (!deliveryAddress.trim() || !contactNumber.trim()) {
      setCheckoutStatus({ type: 'error', message: "Endereço e contato são obrigatórios." });
      return;
    }

    setIsCheckingOut(true);
    setCheckoutStatus(null);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        status: 'pending',
        items: cart,
        totalAmount: cartTotal,
        deliveryAddress,
        contactNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      clearCart();
      setDeliveryAddress('');
      setContactNumber('');
      setCheckoutStatus({ type: 'success', message: "Pedido realizado com sucesso!" });
      setTimeout(() => {
        setIsCartOpen(false);
        setCheckoutStatus(null);
      }, 3000);
    } catch (e: any) {
      console.error(e);
      setCheckoutStatus({ type: 'error', message: "Erro ao criar pedido. Verifica as tuas permissões." });
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const [couponCode, setCouponCode] = useState("GERAR CUPÃO");

  // Simulate a countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    let currentCode = couponCode;
    if (currentCode === "GERAR CUPÃO" || currentCode === "DRIPP25") {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      currentCode = `DRIPP-${randomSuffix}`;
      setCouponCode(currentCode);
    }
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };


  const handleAddToCart = (product: { id: string, name: string, price: number, image?: string }) => {
    addToCart(product);
    setShowCartAdded(product.id);
    setIsCartOpen(true);
    setTimeout(() => setShowCartAdded(null), 2000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailStatus('error');
      setEmailMessage('Por favor, insira o teu email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('error');
      setEmailMessage('Email inválido. Verifica e tenta novamente.');
      return;
    }
    
    // Sucesso
    setEmailStatus('success');
    setEmailMessage('Bem-vindo ao Syndicate! Fica atento ao teu email.');
    setEmail('');
    setTimeout(() => {
      setEmailStatus(null);
      setEmailMessage('');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none z-0">
        <div className="w-full h-full grid grid-cols-12 grid-rows-12">
          <div className="col-span-full row-span-full border-[1px] border-[#FF4D00]/30 transform rotate-12 scale-150"></div>
          <div className="col-span-full row-span-full border-[1px] border-[#FF4D00]/20 transform rotate-45 scale-125"></div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent opacity-30 z-0"></div>
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#FF4D00] to-transparent opacity-30 z-0"></div>

      {/* Navbar */}
      <nav className="w-full p-6 md:p-10 z-50 flex justify-between items-center relative max-w-[1400px] mx-auto text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 md:space-x-4 cursor-pointer"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FF4D00] rounded-full flex items-center justify-center">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-[#09090B] rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase">Dripp Store</span>
        </motion.div>

        <div className="hidden md:flex flex-1 justify-center space-x-8 text-xs font-bold tracking-[0.2em] uppercase opacity-70">
          <Link href="/produtos" className="cursor-pointer hover:opacity-100 transition-opacity text-[#FF4D00]">Lançamentos</Link>
          <Link href="/exclusivos" className="cursor-pointer hover:opacity-100 transition-opacity">Exclusivos</Link>
          <Link href="/arquivos" className="cursor-pointer hover:opacity-100 transition-opacity">Arquivos</Link>
        </div>

        <div className="flex items-center gap-6">
           <div className="relative group z-50">
             <div onClick={() => setIsCartOpen(!isCartOpen)} className="cursor-pointer relative z-50">
               <ShoppingCart size={24} className="hover:text-[#FF4D00] transition-colors" />
               {cart.reduce((a, b) => a + (b.quantity || 1), 0) > 0 && (
                 <div className="absolute -top-2 -right-2 bg-[#FF4D00] text-[#09090B] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full pointer-events-none">
                   {cart.reduce((a, b) => a + (b.quantity || 1), 0)}
                 </div>
               )}
             </div>

             {/* Cart Dropdown */}
             {isCartOpen && (
               <div className="absolute top-full right-0 mt-4 w-72 sm:w-80 bg-white text-[#09090B] shadow-[5px_5px_0px_0px_#FF4D00] md:shadow-[10px_10px_0px_0px_#FF4D00] border-2 border-[#09090B] p-4 z-50 transform origin-top-right transition-all">
                 <div className="flex justify-between items-center mb-4 border-b-2 border-[#09090B]/10 pb-2">
                   <h3 className="font-black uppercase tracking-widest text-lg">Seu Carrinho</h3>
                   <span onClick={() => setIsCartOpen(false)} className="text-2xl font-black cursor-pointer leading-none">&times;</span>
                 </div>
                 
                 {cart.length === 0 ? (
                   <p className="text-xs font-bold opacity-60 text-center py-6">Carrinho vazio.</p>
                 ) : (
                   <div className="space-y-3 max-h-64 overflow-auto pr-1">
                     <AnimatePresence>
                       {cart.map((item, idx) => (
                         <motion.div 
                           key={item.id} 
                           initial={{ opacity: 0, x: 20, scale: 0.95 }}
                           animate={{ opacity: 1, x: 0, scale: 1 }}
                           exit={{ opacity: 0, x: -20, scale: 0.95 }}
                           transition={{ type: "spring", stiffness: 300, damping: 25 }}
                           className="flex justify-between items-center bg-[#09090B]/5 p-3"
                         >
                           <div>
                             <p className="text-xs font-black uppercase tracking-wider">{item.name}</p>
                             <p className="text-[10px] font-bold text-[#09090B]/60 uppercase">Qtd: <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-0.5 align-middle text-[#09090B] bg-white rounded ml-1 transition-colors hover:bg-[#09090B]/10"><Minus size={12} /></button> <span className="inline-block w-3 text-center">{item.quantity || 1}</span> <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-0.5 align-middle text-[#09090B] bg-white rounded transition-colors hover:bg-[#09090B]/10"><Plus size={12} /></button>
                                <button onClick={() => handleRemoveItem(item.id)} className="ml-3 align-middle text-[#09090B]/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></p>
                           </div>
                           <p className="text-sm font-black text-[#FF4D00]">{(item.price * (item.quantity || 1)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                         </motion.div>
                       ))}
                     </AnimatePresence>
                   </div>
                 )}
                 {cart.length > 0 && (
                   <div className="mt-4 pt-4 border-t-2 border-[#09090B]/10">
                     <div className="space-y-3 mb-4">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#09090B]/60 mb-1 block">Endereço de Entrega</label>
                          <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Rua, Bairro, Nº" className="w-full bg-[#09090B]/5 border border-[#09090B]/10 px-3 py-2 text-xs font-bold outline-none focus:border-[#FF4D00] transition-colors text-[#09090B] placeholder:text-[#09090B]/30" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#09090B]/60 mb-1 block">Número de Contato</label>
                          <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="(00) 00000-0000" className="w-full bg-[#09090B]/5 border border-[#09090B]/10 px-3 py-2 text-xs font-bold outline-none focus:border-[#FF4D00] transition-colors text-[#09090B] placeholder:text-[#09090B]/30" />
                       </div>
                     </div>
                     <div className="flex justify-between items-center mb-4 text-sm md:text-base font-black uppercase">
                       <span>Total</span>
                       <div className="relative w-32 flex justify-end items-center h-6 overflow-hidden">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={cartTotal}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.2 }}
                              className="text-[#FF4D00] absolute right-0"
                            >
                              {cartTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                     </div>
                     
                     {checkoutStatus && (
                       <div className={`p-3 mb-4 rounded text-xs font-bold uppercase tracking-widest text-center ${checkoutStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                         {checkoutStatus.message}
                       </div>
                     )}

                     <button 
                       onClick={handleCheckout}
                       disabled={isCheckingOut || cart.length === 0}
                       className="w-full bg-[#FF4D00] hover:bg-[#09090B] text-white hover:text-[#FF4D00] transition-colors py-3 font-black uppercase tracking-widest text-xs border border-transparent hover:border-[#FF4D00] disabled:opacity-50 disabled:cursor-not-allowed">
                       {isCheckingOut ? 'Processando...' : 'Finalizar Compra'}
                     </button>
                   </div>
                 )}
               </div>
             )}
           </div>
           
           {user && (
             <Link href="/orders" className="relative z-50">
               <ShoppingBag size={24} className="hover:text-[#FF4D00] transition-colors" />
             </Link>
           )}

           <AuthButton />
        </div>
      </nav>

      {/* Main Hero Section */}
      <div className="relative min-h-[80vh] flex flex-col justify-center pt-32 md:pt-40 md:mt-[-120px] -mt-[100px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image 
            src="https://picsum.photos/seed/urban/1920/1080"
            alt="Dripp Store"
            fill
            className="object-cover opacity-80 object-center drop-shadow-2xl"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/70 to-transparent" />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 md:px-12 relative z-10 w-full max-w-[1400px] mx-auto py-8">
          
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12 w-full">
            <div className="flex-1 w-full relative z-10 pt-4 lg:pt-8">
              <div className="mb-6 md:mb-8 mt-4 md:mt-0">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 bg-[#FF4D00] text-[#09090B] px-3 py-1 text-xs md:text-sm font-black uppercase tracking-widest"
                >
                  Limitado
                </motion.span>
              </div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-[80px] lg:text-[100px] xl:text-[130px] font-black leading-[0.85] uppercase mb-6 md:mb-8 tracking-tighter text-white"
              >
                Street <br className="hidden md:block"/>
                <span className="text-[#FF4D00]">Evolution.</span>
              </motion.h1>

              <div className="max-w-xl">
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base md:text-xl text-white/80 font-light leading-relaxed"
                >
                  A nova coleção chegou. Domine as ruas com peças exclusivas feitas para quem dita as regras do jogo.
                </motion.p>
              </div>
            </div>

            {/* Coupon Component */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="w-full max-w-[280px] mx-auto lg:mx-0 shrink-0 scale-75 md:scale-90 lg:scale-100 lg:mt-16 relative z-20"
            >
            <div className="bg-white text-[#09090B] p-1 rotate-[-2deg] shadow-[6px_6px_0px_0px_#FF4D00] md:shadow-[8px_8px_0px_0px_#FF4D00] transition-transform hover:rotate-0 duration-300">
              <div className="border-2 border-dashed border-[#09090B] px-4 sm:px-5 py-4 sm:py-5 flex flex-col items-center text-center">
                
                {/* Timer */}
                <div className="flex items-center justify-center gap-1.5 text-[8px] sm:text-[9px] font-bold bg-[#09090B]/5 px-2.5 py-1 rounded-full mb-3 text-[#09090B] uppercase tracking-widest">
                  <Clock size={10} className="shrink-0" />
                  <span>Expira em: {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>

                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">CUPÃO DE DESCONTO</span>
                <span className="text-2xl sm:text-3xl font-black tracking-tighter mb-1 break-all sm:break-normal">{couponCode}</span>
                <span className="text-[9px] sm:text-[10px] font-bold opacity-80">-25% NA PRIMEIRA COMPRA</span>
                
                <div className="h-[2px] w-full bg-[#09090B]/10 my-2.5 sm:my-3"></div>

                <p className="text-[#09090B]/50 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase mb-1 text-center">Toque para gerar / copiar</p>
                
                <button 
                  onClick={handleCopy}
                  className={`w-full group relative overflow-hidden border-2 transition-all duration-300 flex items-center justify-between p-2 sm:p-2.5 bg-transparent ${
                    copied 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-dashed border-[#09090B] hover:border-[#FF4D00] hover:bg-[#09090B]/5'
                  }`}
                >
                  <span className={`text-lg sm:text-xl font-black tracking-tighter truncate max-w-[80%] text-left ${copied ? 'text-green-600' : 'text-[#09090B]'}`}>
                    {couponCode}
                  </span>
                  
                  <div className={`p-1 transition-colors flex items-center justify-center shrink-0 ${copied ? 'text-green-500' : 'text-[#09090B] opacity-40 group-hover:opacity-100 group-hover:text-[#FF4D00]'}`}>
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full mt-20 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          <div className="flex flex-col items-start px-4 border-l-2 border-[#FF4D00]/50 hover:border-[#FF4D00] transition-colors group relative cursor-help">
            <div className="text-[#FF4D00] mb-3 relative">
              <Truck size={28} strokeWidth={2} />
              <div className="absolute bottom-full left-0 mb-3 w-48 bg-white text-[#09090B] text-[10px] sm:text-xs font-bold p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 shadow-[5px_5px_0px_0px_#FF4D00] pointer-events-none">
                Entregas rápidas e seguras via transportadoras parceiras rastreáveis em tempo real.
                <div className="absolute top-full left-4 border-8 border-transparent border-t-white"></div>
              </div>
            </div>
            <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Entregas Fixas 2.000 Kz</h4>
            <p className="text-xs text-white/50 font-light leading-relaxed">Para todo o país nas compras acima de 40.000 Kz.</p>
          </div>
          
          <div className="flex flex-col items-start px-4 border-l-2 border-[#FF4D00]/50 hover:border-[#FF4D00] transition-colors group relative cursor-help">
            <div className="text-[#FF4D00] mb-3 relative">
              <span className="font-black text-2xl tracking-tighter flex items-center h-[28px]">100%</span>
              <div className="absolute bottom-full left-0 mb-3 w-48 bg-white text-[#09090B] text-[10px] sm:text-xs font-bold p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 shadow-[5px_5px_0px_0px_#FF4D00] pointer-events-none">
                Produtos adquiridos diretamente dos fornecedores oficiais e com nota fiscal.
                <div className="absolute top-full left-4 border-8 border-transparent border-t-white"></div>
              </div>
            </div>
            <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Original</h4>
            <p className="text-xs text-white/50 font-light leading-relaxed">Trabalhamos apenas com as melhores marcas originais.</p>
          </div>

          <div className="flex flex-col items-start px-4 border-l-2 border-[#FF4D00]/50 hover:border-[#FF4D00] transition-colors group relative cursor-help">
            <div className="text-[#FF4D00] mb-3 relative">
              <ShieldCheck size={28} strokeWidth={2} />
              <div className="absolute bottom-full left-0 mb-3 w-48 bg-white text-[#09090B] text-[10px] sm:text-xs font-bold p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 shadow-[5px_5px_0px_0px_#FF4D00] pointer-events-none">
                Processo simplificado via sistema online. Sem burocracia para trocar ou devolver.
                <div className="absolute top-full left-4 border-8 border-transparent border-t-white"></div>
              </div>
            </div>
            <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Troca Fácil</h4>
            <p className="text-xs text-white/50 font-light leading-relaxed">Primeira troca grátis em até 7 dias após o recebimento.</p>
          </div>
        </motion.div>
      </main>
      </div>

      {/* Recent Drops Section */}
      <section className="w-full max-w-[1400px] mx-auto mt-12 md:mt-24 px-6 md:px-12 relative z-10">
        <div className="flex justify-between items-end mb-10 md:mb-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">Últimos <br/><span className="text-[#FF4D00]">Drops</span></h2>
            <p className="text-xs md:text-sm opacity-60 uppercase tracking-widest font-bold">Edições Limitadas</p>
          </div>
          <Link href="/produtos" className="hidden md:flex items-center gap-2 uppercase tracking-widest text-xs font-bold hover:text-[#FF4D00] transition-colors border-b border-white hover:border-[#FF4D00] pb-1">
            Ver Todos <ArrowRight size={14} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center items-center py-20 text-[#FF4D00]">
             <span className="block w-8 h-8 rounded-full border-4 border-t-[#FF4D00] border-r-[#FF4D00] border-b-transparent border-l-transparent animate-spin"></span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-white/50 text-sm font-bold uppercase tracking-widest">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((item) => (
              <div key={item.id} className="group relative cursor-pointer flex flex-col">
                <Link href={`/produtos/${item.id}`} className="relative aspect-[3/4] bg-white/5 overflow-hidden mb-4 block">
                  {item.images && item.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.name} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-[#09090B]">
                      <Package size={48} className="text-white/20" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div 
                    className="absolute inset-0 bg-[#09090B]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToCart({ id: item.id, name: item.name, price: item.price, image: item.images?.[0] });
                    }}
                  >
                    <span className="bg-[#FF4D00] text-[#09090B] font-black uppercase text-xs tracking-widest py-3 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-[0_10px_20px_rgba(255,77,0,0.3)] hover:scale-105">
                      {showCartAdded === item.id ? (
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Adicionado</span>
                      ) : (
                        "Adicionar"
                      )}
                    </span>
                  </div>
                </Link>
                <Link href={`/produtos/${item.id}`} className="flex justify-between items-start mt-auto group-hover:text-white">
                  <div>
                    <h3 className="font-bold uppercase tracking-wide text-sm mb-1 group-hover:text-[#FF4D00] transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest line-clamp-1 max-w-[150px]">{item.description || 'Produto'}</p>
                  </div>
                  <span className="font-black text-sm whitespace-nowrap ml-2">{item.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </Link>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 flex justify-center md:hidden">
            <Link href="/produtos" className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold hover:text-[#FF4D00] transition-colors border-b border-white hover:border-[#FF4D00] pb-1">
              Ver Todos <ArrowRight size={14} />
            </Link>
        </div>
      </section>

      {/* Collections Banner */}
      <section className="w-full max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 md:px-12 relative z-10">
        <div className="relative w-full h-[50vh] md:h-[60vh] min-h-[400px] bg-white/5 overflow-hidden border border-white/10 flex items-center p-8 md:p-16 group cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://picsum.photos/seed/dripbrand1/1600/900" alt="Collection" className="absolute inset-0 object-cover w-full h-full opacity-40 grayscale group-hover:scale-105 group-hover:opacity-60 transition-all duration-700" />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

          <div className="relative z-10 max-w-xl">
            <span className="bg-white text-[#09090B] px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-[5px_5px_0px_0px_#FF4D00]">SS/24 Collection</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-6 leading-none">Concrete <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Jungle</span></h2>
            <p className="text-sm md:text-base opacity-80 font-light leading-relaxed mb-8 max-w-md">
              Inspirada nas texturas da cidade e na brutalidade urbana. Utilitária, oversized e feita para resistir.
            </p>
            <button className="bg-transparent border-2 border-white hover:bg-white hover:text-[#09090B] text-white font-black py-3 md:py-4 px-6 md:px-8 transition-colors flex items-center space-x-3 md:space-x-4">
              <span className="uppercase tracking-widest text-[10px] md:text-xs">Explorar Coleção</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="w-full max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 md:px-12 mb-10 md:mb-20 relative z-10 text-center flex flex-col items-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FF4D00]/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-3 h-3 md:w-4 md:h-4 bg-[#FF4D00] transform rotate-45"></div>
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Venha fazer parte da <span className="text-[#FF4D00]">história</span></h2>
        <p className="text-xs md:text-sm opacity-60 font-light max-w-md mx-auto mb-8">
          Inscreva-se para acesso antecipado a novos drops, collabs exclusivas e eventos secretos da Dripp Store.
        </p>
        
        <div className="w-full max-w-md flex flex-col relative">
          <form className="w-full flex relative" onSubmit={handleNewsletterSubmit} suppressHydrationWarning>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailStatus) setEmailStatus(null);
              }}
              placeholder="TEU MELHOR EMAIL" 
              className={`w-full bg-white/5 border-b-2 px-6 py-4 text-xs md:text-sm font-bold tracking-widest outline-none transition-colors uppercase placeholder:text-white/20 hover:bg-white/10 ${
                emailStatus === 'error' ? 'border-red-500 focus:border-red-500' : 
                emailStatus === 'success' ? 'border-green-500 focus:border-green-500' : 
                'border-white/20 focus:border-[#FF4D00]'
              }`} 
            />
            <button type="submit" className="absolute right-0 top-0 bottom-0 px-6 flex items-center text-[#FF4D00] hover:text-white transition-colors bg-[#09090B]/20">
              <ArrowRight size={20} />
            </button>
          </form>
          
          <div className="h-6 mt-2 flex items-center justify-center">
            {emailMessage && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-bold tracking-widest uppercase ${
                  emailStatus === 'error' ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {emailMessage}
              </motion.span>
            )}
          </div>
        </div>
      </section>

      {/* Footer / CTA Area */}
      <footer className="p-6 md:p-12 pb-12 flex flex-col md:flex-row justify-between items-end z-10 relative max-w-[1400px] w-full mx-auto gap-12 md:gap-6 mt-10">
        <div className="flex flex-col w-full md:w-auto order-2 md:order-1">
          <span className="text-[10px] uppercase tracking-[0.4em] opacity-40 mb-4">{new Date().getFullYear()} Dripp Store. Todos os direitos.</span>
          <div className="flex space-x-6 text-sm">
            <span className="font-bold border-b border-[#FF4D00] pb-1 cursor-pointer">Instagram</span>
            <span className="font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer">TikTok</span>
            <span className="font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer">Twitter</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-6 md:space-y-0 md:space-x-8 w-full md:w-auto order-1 md:order-2">
          <div className="text-start md:text-right">
            <p className="text-xs opacity-50 uppercase tracking-widest flex items-center md:justify-end gap-1 mb-1">
              <Info size={12}/> Válido apenas na
            </p>
            <p className="font-black uppercase tracking-wider">Primeira Compra</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#ffffff" }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#FF4D00] text-[#09090B] font-black py-4 md:py-6 px-8 md:px-12 rounded-full transition-colors flex items-center justify-center space-x-4 shadow-[0_0_40px_-10px_#FF4D00]"
          >
            <span className="uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag size={20} className="hidden md:block" /> 
              Usar Agora
            </span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ArrowRight size={24} strokeWidth={3} />
            </motion.div>
          </motion.button>
        </div>
      </footer>

    </div>
  );
}
