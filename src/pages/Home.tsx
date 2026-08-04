import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, CompanyInfo } from '../types';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/utils';
import { Plus, Check, X, ShoppingBag, HelpCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { initialMenu } from '../lib/seedData';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { isStoreOpen } from '../lib/openingHours';
import { ProductModal } from '../components/ProductModal';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const { user } = useAuth();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'company_info'), (snapshot) => {
      if (snapshot.exists()) {
        setCompanyInfo(snapshot.data() as CompanyInfo);
      }
    });
    return () => unsub();
  }, []);

  const [alert, setAlert] = useState<{
    type: 'success' | 'cancel' | 'warning';
    message: string;
    submessage?: string;
  } | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleProductClick = (product: Product) => {
    const status = isStoreOpen(companyInfo);
    if (!status.isOpen && user?.role !== 'admin') {
      setAlert({
        type: 'warning',
        message: 'Estamos Fechados',
        submessage: status.reason
      });
      return;
    }
    
    setSelectedProduct(product);
  };

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const prods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAutoSeed = async () => {
    if (!user) {
      setAlert({
        type: 'warning',
        message: 'Acesso Restrito',
        submessage: 'Faça login como Admin de Teste para carregar o cardápio padrão!'
      });
      return;
    }
    setLoading(true);
    for (const item of initialMenu) {
      await addDoc(collection(db, 'products'), item);
    }
    await fetchProducts();
  };

  const availableProducts = products.filter(p => p.available);
  const categories = Array.from(new Set(availableProducts.map(p => p.category)));
  // Define a default order or just use the extracted ones.
  // We'll sort them as they appear or alphabetically.
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Friendly Closed Alert Banner */}
      {(() => {
        const status = isStoreOpen(companyInfo);
        if (!status.isOpen) {
          return (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 shadow-xs animate-pulse">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">Aviso: Estabelecimento Fechado</h3>
                <p className="text-xs font-bold mt-1 text-amber-800 leading-relaxed">{status.reason}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-amber-600 mt-2">Você ainda pode navegar no cardápio, mas os pedidos estão suspensos no momento.</p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="mb-6 bg-brand/10 p-4 rounded-xl border border-brand/20">
        <h1 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-wider">Cardápio</h1>
        <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Faça seu pedido online.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm font-bold text-gray-500 uppercase tracking-widest">Carregando cardápio...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-wider">Cardápio Vazio</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">O cardápio ainda não foi configurado.</p>
          <button 
            onClick={handleAutoSeed}
            className="bg-brand text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-brand-dark transition-colors shadow-sm"
          >
            Carregar Cardápio de Teste
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.filter(p => p.category === category).map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>

      {/* Floating Animated Toast Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 w-full max-w-xs px-4"
          >
            <div className={`rounded-xl shadow-xl border p-4 flex items-center gap-3 ${
              alert.type === 'success' 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : alert.type === 'warning'
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-gray-800 border-gray-700 text-white"
            }`}>
              {alert.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white shadow-sm shadow-emerald-500/20">
                  <Check size={18} className="stroke-[3]" />
                </div>
              ) : alert.type === 'warning' ? (
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white shadow-sm shadow-amber-500/20">
                  <AlertCircle size={18} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0 text-white">
                  <X size={18} className="stroke-[3]" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider leading-tight">
                  {alert.message}
                </p>
                {alert.submessage && (
                  <p className="text-[10px] opacity-90 mt-0.5 leading-none font-medium">
                    {alert.submessage}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ 
  product, 
  onAddClick 
}: { 
  product: Product; 
  onAddClick: () => void; 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={onAddClick}>
      <div>
        <div className="flex items-start gap-3 mb-2">
          {product.imageUrl ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center text-gray-300">
              <ImageIcon size={24} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-bold text-gray-900 leading-tight pr-2" translate="no">{product.name}</h3>
              <div className="text-right shrink-0">
                {product.priceOption2 !== undefined && <p className="text-[9px] text-brand font-bold uppercase tracking-widest">A partir de</p>}
                <p className="text-sm font-black text-gray-900">{formatCurrency(product.price)}</p>
              </div>
            </div>
            {product.description && <p className="text-[9px] text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onAddClick(); }}
          className="w-full py-1.5 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand/20 transition-colors"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
