import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, sanitizeForFirestore, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { formatCurrency, compressImage } from '../lib/utils';
import { Edit, Trash2, Plus, X, Check, AlertTriangle, AlertCircle, Search, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { initialMenu } from '../lib/seedData';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    price: 0,
    available: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    submessage?: string;
  } | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => {
        const data = doc.data() as Product;
        if (data.category && data.category.toUpperCase().startsWith('MONTE SEU ')) {
          data.category = 'Monte sua Massa';
        }
        return { id: doc.id, ...data };
      }));
    });
    return () => unsub();
  }, []);

  const handleToggleAvailable = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { available: !product.available });
      setAlert({
        type: 'success',
        message: 'Status Atualizado!',
        submessage: `O item "${product.name}" agora está ${!product.available ? 'Disponível' : 'Indisponível'}.`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const handleDeleteAttempt = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setAlert({
        type: 'success',
        message: 'Item Excluído!',
        submessage: `O item "${productToDelete.name}" foi removido com sucesso.`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productToDelete.id}`);
    } finally {
      setProductToDelete(null);
    }
  };

  const seedMenu = async () => {
    try {
      for (const item of initialMenu) {
        await setDoc(doc(collection(db, 'products')), item);
      }
      setAlert({
        type: 'success',
        message: 'Cardápio Inicial Carregado!',
        submessage: `${initialMenu.length} itens padrões foram criados.`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleEdit = (product: Product) => {
    setIsCreatingCategory(false);
    setFormData(product);
    setEditingId(product.id);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setIsCreatingCategory(false);
    setFormData({
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0] : '',
      price: 0,
      priceOption2: undefined,
      options: [],
      available: true,
    });
    setEditingId(null);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      customizationSteps: [
        ...(prev.customizationSteps || []),
        { title: '', min: 0, max: 1, options: [] }
      ]
    }));
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newSteps = [...(prev.customizationSteps || [])];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, customizationSteps: newSteps };
    });
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => {
      const newSteps = [...(prev.customizationSteps || [])];
      newSteps.splice(index, 1);
      return { ...prev, customizationSteps: newSteps };
    });
  };

  const handleAddOptionToStep = (stepIndex: number) => {
    setFormData(prev => {
      const newSteps = [...(prev.customizationSteps || [])];
      newSteps[stepIndex].options.push({ name: '', price: undefined });
      return { ...prev, customizationSteps: newSteps };
    });
  };

  const handleUpdateOptionInStep = (stepIndex: number, optionIndex: number, field: string, value: any) => {
    setFormData(prev => {
      const newSteps = [...(prev.customizationSteps || [])];
      newSteps[stepIndex].options[optionIndex] = { ...newSteps[stepIndex].options[optionIndex], [field]: value };
      return { ...prev, customizationSteps: newSteps };
    });
  };

  const handleRemoveOptionFromStep = (stepIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newSteps = [...(prev.customizationSteps || [])];
      newSteps[stepIndex].options.splice(optionIndex, 1);
      return { ...prev, customizationSteps: newSteps };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = formData.imageUrl;
    
    try {
      if (imageFile) {
        imageUrl = await compressImage(imageFile, 800, 800, 0.7);
      }

      const updatedFormData = { ...formData, imageUrl };
      const sanitizedData = sanitizeForFirestore(updatedFormData);
      
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), sanitizedData as any);
        setAlert({
          type: 'success',
          message: 'Item Atualizado!',
          submessage: `As alterações em "${formData.name}" foram salvas.`
        });
      } else {
        await addDoc(collection(db, 'products'), sanitizedData as any);
        setAlert({
          type: 'success',
          message: 'Item Criado!',
          submessage: `"${formData.name}" foi adicionado com sucesso.`
        });
      }
      setIsFormOpen(false);
      setEditingId(null);
      setImageFile(null);
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: 'Erro ao Salvar',
        submessage: err.message || 'Verifique sua conexão e tente novamente.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'unavailable') return !product.available;
    if (selectedCategory !== 'all') return product.category === selectedCategory;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">Gerenciar Cardápio</h1>
        <div className="flex gap-2">
          {products.length === 0 && (
            <button onClick={seedMenu} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-200 text-[10px] font-bold uppercase tracking-widest transition-colors">
              Carregar Padrão
            </button>
          )}
          <button onClick={handleAddNew} className="bg-brand text-white px-4 py-2 rounded-lg shadow-sm hover:bg-brand-dark flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors">
            <Plus size={14} /> Novo Item
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{editingId ? 'Editar Item' : 'Novo Item'}</h2>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Foto do Item</label>
              <div className="flex items-center gap-4">
                {(imageFile || formData.imageUrl) && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg cursor-pointer transition-colors">
                    <UploadCloud size={18} className="mr-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {imageFile ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nome do Item</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Descrição</label>
              <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                {!isCreatingCategory && (
                  <button type="button" onClick={() => { setIsCreatingCategory(true); setFormData({...formData, category: ''}); }} className="text-[9px] font-bold text-brand uppercase tracking-widest hover:underline">
                    + Nova
                  </button>
                )}
                {isCreatingCategory && (
                  <button type="button" onClick={() => { setIsCreatingCategory(false); setFormData({...formData, category: categories[0] || ''}); }} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:underline">
                    Cancelar
                  </button>
                )}
              </div>
              {isCreatingCategory ? (
                <input 
                  type="text" 
                  required
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  placeholder="Nome da nova categoria"
                  className="w-full px-3 py-2 border border-brand bg-brand/5 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand transition-colors" 
                  autoFocus
                />
              ) : (
                <select 
                  required
                  value={formData.category} 
                  onChange={e => {
                    if (e.target.value === 'NEW_CATEGORY') {
                      setIsCreatingCategory(true);
                      setFormData({...formData, category: ''});
                    } else {
                      setFormData({...formData, category: e.target.value});
                    }
                  }} 
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand appearance-none" 
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="NEW_CATEGORY" className="font-bold text-brand">+ Criar nova categoria...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Preço Padrão (R$)</label>
              <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand" />
            </div>
            {/* Customization options are shown for any category, or you can leave it always visible if they want to add options */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Acompanhamentos (separados por vírgula, opcional)</label>
              <input type="text" value={formData.options?.join(', ') || ''} onChange={e => setFormData({...formData, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="Ex: batata frita, legume, verdura" className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Preço Opção 2 Pedaços (Opcional, R$)</label>
              <input type="number" step="0.01" value={formData.priceOption2 !== undefined ? formData.priceOption2 : ''} onChange={e => setFormData({...formData, priceOption2: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-brand focus:border-brand" />
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Etapas de Personalização (Para produtos montados)</label>
                <button type="button" onClick={handleAddStep} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-1">
                  <Plus size={12} /> Adicionar Etapa
                </button>
              </div>

              {formData.customizationSteps && formData.customizationSteps.length > 0 ? (
                <div className="space-y-4">
                  {formData.customizationSteps.map((step, stepIndex) => (
                    <div key={stepIndex} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 relative group">
                      <button type="button" onClick={() => handleRemoveStep(stepIndex)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Título da Etapa</label>
                          <input type="text" required value={step.title} onChange={e => handleUpdateStep(stepIndex, 'title', e.target.value)} placeholder="Ex: Escolha sua carne" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mínimo (Qtd)</label>
                          <input type="number" required min="0" value={step.min} onChange={e => handleUpdateStep(stepIndex, 'min', parseInt(e.target.value) || 0)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Máximo (em branco = s/ limite)</label>
                          <input type="number" min="0" value={step.max === 999 ? '' : step.max} onChange={e => {
                            const val = e.target.value;
                            handleUpdateStep(stepIndex, 'max', val === '' ? 999 : (parseInt(val) || 0));
                          }} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand" placeholder="Sem limite" />
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Opções desta Etapa</label>
                          <button type="button" onClick={() => handleAddOptionToStep(stepIndex)} className="text-brand text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                            <Plus size={10} /> Nova Opção
                          </button>
                        </div>
                        
                        {step.options.length > 0 ? (
                          <div className="space-y-2">
                            {step.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <input type="text" required value={option.name} onChange={e => handleUpdateOptionInStep(stepIndex, optionIndex, 'name', e.target.value)} placeholder="Nome da opção" className="w-full px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand" />
                                </div>
                                <div className="w-24">
                                  <input type="number" step="0.01" value={option.price !== undefined ? option.price : ''} onChange={e => handleUpdateOptionInStep(stepIndex, optionIndex, 'price', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="R$ +0,00" className="w-full px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand" />
                                </div>
                                <button type="button" onClick={() => handleRemoveOptionFromStep(stepIndex, optionIndex)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mt-0.5">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 text-center py-2 italic">Nenhuma opção adicionada.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Nenhuma etapa de personalização.
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isUploading} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={isUploading} className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Item</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100 mb-8">
        {/* Search and Filters Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, descrição ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-2xs"
              />
            </div>
            <div className="text-[11px] font-black text-gray-500 uppercase tracking-wider self-end sm:self-auto">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory('unavailable')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === 'unavailable'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Indisponíveis ({products.filter(p => !p.available).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat} ({products.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE VIEW (Cards layout for small screens) */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  {product.imageUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center text-gray-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-black text-gray-900 leading-snug" translate="no">
                        {product.name}
                      </h3>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200/60">
                        {product.category || 'Sem Categoria'}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price and Options */}
                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Preço</span>
                    <span className="text-sm font-black text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.priceOption2 && (
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-brand uppercase tracking-widest block">2 Pedaços</span>
                      <span className="text-xs font-black text-brand">
                        {formatCurrency(product.priceOption2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button 
                    onClick={() => handleToggleAvailable(product)}
                    className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 ${
                      product.available 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${product.available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {product.available ? 'Disponível' : 'Indisponível'}
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleEdit(product)} 
                      className="min-h-[38px] px-3 bg-gray-100 hover:bg-brand/10 hover:text-brand text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors active:scale-98"
                      title="Editar"
                    >
                      <Edit size={15} />
                      <span className="text-[10px] uppercase font-black">Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteAttempt(product)} 
                      className="min-h-[38px] px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors active:scale-98"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              Nenhum item encontrado.
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (Table with horizontal scroll fallback) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center text-gray-300">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-gray-900 leading-tight" translate="no">{product.name}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[280px] mt-0.5">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {product.category || 'Sem Categoria'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-black">
                      {formatCurrency(product.price)}
                      {product.priceOption2 && <span className="text-[9px] text-brand font-bold uppercase tracking-widest block mt-0.5">2 pedaços: {formatCurrency(product.priceOption2)}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button 
                        onClick={() => handleToggleAvailable(product)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer active:scale-95 ${
                          product.available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {product.available ? 'Disponível' : 'Indisponível'}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                      <button onClick={() => handleEdit(product)} className="text-gray-400 hover:text-brand inline-flex p-1.5 rounded-md hover:bg-brand/10 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteAttempt(product)} className="text-gray-400 hover:text-red-600 inline-flex p-1.5 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setProductToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <AlertTriangle size={24} className="stroke-[2.5]" />
                </div>
                
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                  Excluir Item?
                </h3>
                
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">
                  Tem certeza que deseja remover este item permanentemente do cardápio?
                </p>

                <div className="w-full bg-red-50/50 rounded-xl border border-red-100/50 p-4 mb-6 text-left">
                  <h4 className="text-xs font-black text-red-950">
                    {productToDelete.name}
                  </h4>
                  <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider mt-1">
                    Categoria: {productToDelete.category || 'Sem Categoria'}
                  </p>
                  <p className="text-[10px] text-red-900 font-black mt-0.5">
                    Preço: {formatCurrency(productToDelete.price)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="py-2.5 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-98"
                  >
                    Não, Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
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
                : alert.type === 'error'
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-gray-800 border-gray-700 text-white"
            }`}>
              {alert.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white shadow-sm shadow-emerald-500/20">
                  <Check size={18} className="stroke-[3]" />
                </div>
              ) : alert.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0 text-white shadow-sm shadow-rose-500/20">
                  <AlertCircle size={18} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shrink-0 text-white">
                  <Check size={18} className="stroke-[3]" />
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
