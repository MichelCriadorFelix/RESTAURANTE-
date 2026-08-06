import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Product, CartItem, StepOption } from '../types';
import { formatCurrency } from '../lib/utils';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<{ [stepTitle: string]: StepOption[] }>({});
  const [notes, setNotes] = useState('');

  // Initial legacy state if needed
  const [selectedOption, setSelectedOption] = useState<string>(
    product.options && product.options.length > 0 ? 'Nenhum' : ''
  );
  const [selectedSize, setSelectedSize] = useState<'1 pedaço' | '2 pedaços'>('1 pedaço');

  const handleToggleOption = (stepTitle: string, option: StepOption, isRadio: boolean) => {
    setSelections(prev => {
      const current = prev[stepTitle] || [];
      if (isRadio) {
        return { ...prev, [stepTitle]: [option] };
      }
      
      const exists = current.find(o => o.name === option.name);
      if (exists) {
        return { ...prev, [stepTitle]: current.filter(o => o.name !== option.name) };
      } else {
        return { ...prev, [stepTitle]: [...current, option] };
      }
    });
  };

  const calculateTotal = () => {
    let basePrice = product.price;
    if (product.priceOption2 !== undefined && selectedSize === '2 pedaços') {
      basePrice = product.priceOption2;
    }

    let optionsTotal = 0;
    Object.values(selections).forEach(stepSelections => {
      stepSelections.forEach(opt => {
        if (opt.price) optionsTotal += opt.price;
      });
    });

    return (basePrice + optionsTotal) * quantity;
  };

  const canAddToCart = () => {
    if (!product.customizationSteps) return true;
    for (const step of product.customizationSteps) {
      const currentSelections = selections[step.title] || [];
      if (currentSelections.length < step.min) return false;
      if (step.max !== 999 && currentSelections.length > step.max) return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!canAddToCart()) return;
    
    addItem({
      product,
      quantity,
      selectedOption: product.customizationSteps ? undefined : selectedOption,
      selectedSize: product.customizationSteps ? undefined : selectedSize,
      customizationSelections: product.customizationSteps ? selections : undefined,
      notes,
      totalPrice: calculateTotal()
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          {product.imageUrl ? (
            <div className="w-full h-48 sm:h-56 bg-gray-100">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
               {/* Placeholder */}
            </div>
          )}
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">{product.name}</h2>
          {product.description && <p className="text-xs text-gray-500 mt-2 font-medium">{product.description}</p>}
          <div className="mt-3 text-lg font-black text-gray-900">{formatCurrency(product.price)}</div>

          {/* Legacy options rendering */}
          {!product.customizationSteps && product.options && product.options.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Acompanhamento</h3>
              <select 
                className="w-full text-sm py-2 px-3 border border-gray-200 rounded-lg focus:border-brand focus:ring-brand bg-gray-50"
                value={selectedOption}
                onChange={e => setSelectedOption(e.target.value)}
              >
                <option value="Nenhum">Nenhum</option>
                {product.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          )}

          {!product.customizationSteps && product.priceOption2 !== undefined && (
            <div className="mt-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Tamanho</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={selectedSize === '1 pedaço'} onChange={() => setSelectedSize('1 pedaço')} className="text-brand w-4 h-4" />
                  <span className="text-sm font-medium">1 Pedaço</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={selectedSize === '2 pedaços'} onChange={() => setSelectedSize('2 pedaços')} className="text-brand w-4 h-4" />
                  <span className="text-sm font-medium">2 Pedaços</span>
                </label>
              </div>
            </div>
          )}
              {/* New Customization Steps */}
          {product.customizationSteps?.map((step, idx) => {
            const currentSelections = selections[step.title] || [];
            const isRadio = step.max === 1;
            const isFulfilled = currentSelections.length >= step.min && (step.max === 999 || currentSelections.length <= step.max);
            
            let subtitle = '';
            if (step.min > 0 && step.max === 999) subtitle = `Selecione mínimo ${step.min} opções`;
            else if (step.min === 0 && step.max > 0 && step.max !== 999) subtitle = `Selecione até ${step.max} opção`;
            else if (step.min === step.max) subtitle = `Selecione ${step.min} opções`;
            else subtitle = `Selecione de ${step.min} a ${step.max} opções`;
            
            let badgeText = step.min > 0 ? 'Obrigatório' : 'Opcional';
            let badgeClass = step.min > 0 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600';
            
            if (isFulfilled && step.min > 0) {
              badgeText = 'Concluído';
              badgeClass = 'bg-green-500 text-white';
            }

            return (
              <div key={idx} className="mt-8">
                <div className="flex justify-between items-center bg-gray-100 p-3 rounded-t-lg">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{step.title}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {subtitle}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {step.options.map((opt, oIdx) => {
                    const isSelected = currentSelections.some(s => s.name === opt.name);
                    const isDisabled = !isSelected && step.max !== 999 && currentSelections.length >= step.max && !isRadio;
                    
                    return (
                      <label 
                        key={oIdx} 
                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {isRadio ? (
                            <input 
                              type="radio" 
                              checked={isSelected} 
                              onChange={() => !isDisabled && handleToggleOption(step.title, opt, true)} 
                              className="text-brand focus:ring-brand w-4 h-4" 
                              disabled={isDisabled}
                            />
                          ) : (
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => !isDisabled && handleToggleOption(step.title, opt, false)} 
                              className="text-brand focus:ring-brand w-4 h-4 rounded" 
                              disabled={isDisabled}
                            />
                          )}
                          <span className="text-xs font-bold text-gray-800">{opt.name}</span>
                        </div>
                        {opt.price && (
                          <span className="text-[10px] font-black text-gray-500">+{formatCurrency(opt.price)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mt-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Comentários</h3>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma observação? (Opcional)"
              className="w-full text-sm py-3 px-3 border border-gray-200 rounded-lg focus:border-brand focus:ring-brand bg-gray-50 h-24 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center gap-4 bg-white">
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1 shrink-0">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition-all"
            >
              <Minus size={16} />
            </button>
            <span className="font-black text-sm w-4 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button 
            onClick={handleAdd}
            disabled={!canAddToCart()}
            className="flex-1 bg-brand text-white py-3 px-4 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-brand-dark transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Adicionar</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
