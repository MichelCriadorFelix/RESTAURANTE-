import React, { useState } from 'react';
import { CompanyInfo } from '../types';
import { isStoreOpen, DAY_NAMES } from '../lib/openingHours';
import { X, MapPin, Share2, Bike, ShoppingBag, Store, Info, Check, AlertCircle } from 'lucide-react';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: CompanyInfo | null;
}

const WEEKDAYS = [
  { key: '0', label: 'Domingo' },
  { key: '1', label: 'Segunda-feira' },
  { key: '2', label: 'Terça-feira' },
  { key: '3', label: 'Quarta-feira' },
  { key: '4', label: 'Quinta-feira' },
  { key: '5', label: 'Sexta-feira' },
  { key: '6', label: 'Sábado' },
];

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({ isOpen, onClose, companyInfo }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const status = isStoreOpen(companyInfo);
  const currentDayOfWeek = new Date().getDay().toString();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: companyInfo?.name || 'Sensação Gourmet',
          text: 'Confira nosso cardápio e faça seu pedido online!',
          url: window.location.origin,
        });
        return;
      } catch (e) {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullAddress = companyInfo?.address || 'Av. Euclídes da Cunha, 800 - Vila São João, São João de Meriti - RJ, 25570-162, Brasil';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 md:p-6 text-gray-900 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">Informação</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Store Title & Badge */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-widest mb-2">
              <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span>{status.isOpen ? 'Aberto' : 'Fechado'}</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide leading-tight">
              {companyInfo?.name || 'SENSAÇÃO GOURMET'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              title="Compartilhar"
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand transition-all relative"
            >
              <Share2 size={18} />
              {copied && (
                <span className="absolute -bottom-7 right-0 bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                  Link copiado!
                </span>
              )}
            </button>
            {companyInfo?.logoUrl ? (
              <img src={companyInfo.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-xs" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-brand text-white font-black flex items-center justify-center text-sm shadow-xs">
                SG
              </div>
            )}
          </div>
        </div>

        {/* Address Section */}
        <div className="mb-6 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Endereço</h4>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 text-xs font-bold text-gray-700 hover:text-brand transition-colors group"
          >
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
              <MapPin size={16} />
            </div>
            <span className="leading-relaxed underline decoration-gray-300 group-hover:decoration-brand">{fullAddress}</span>
          </a>
        </div>

        {/* Tipos de Serviço */}
        <div className="mb-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Tipos de serviço</h4>
          
          <div className="space-y-3">
            {/* Delivery Card */}
            <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                    <Bike size={18} />
                  </div>
                  <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Delivery</span>
                </div>
                <Check size={18} className="text-gray-900" />
              </div>

              <div className="pl-8 text-xs text-gray-600 space-y-2">
                <p className="font-bold text-gray-800">
                  Tempo de entrega em casa: <span className="font-black text-gray-900">30 - 60min.</span>
                </p>
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Abrangência da entrega</p>
                  <p className="text-[11px] font-medium text-gray-600 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-200/80">
                    Praça Gil, Jardim Sumaré, Agostinho Porto, Vila Rosali, São João, Parque Barreto, Parque Lafaiete, Vila Ruth, Jardim Noia, Rodo, Vila São João, Jardim Paraíso, Praça da Bandeira, Metrópoles, Vilar dos Teles, Jardim Íris, Jardim Meriti, Jardim Botânico, Olavo Bilac.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
                  <Info size={13} className="text-amber-500 shrink-0" />
                  <span>Se recebermos pedidos fora do alcance, a entrega poderá ser ajustada.</span>
                </div>
              </div>
            </div>

            {/* Retirada Card */}
            <div className="border border-gray-200 rounded-xl p-3.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShoppingBag size={18} />
                </div>
                <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Retirada</span>
              </div>
              <Check size={18} className="text-gray-900" />
            </div>

            {/* No local Card */}
            <div className="border border-gray-200 rounded-xl p-3.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Store size={18} />
                </div>
                <span className="text-sm font-black text-gray-900 uppercase tracking-wide">No local</span>
              </div>
              <Check size={18} className="text-gray-900" />
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-3">Horário de funcionamento</h4>
          
          <div className="space-y-1">
            {WEEKDAYS.map((day) => {
              const dayData = companyInfo?.openingHours?.[day.key] || {
                isOpen: day.key !== '2', // Tuesday closed by default as in screenshot
                openTime: '18:30',
                closeTime: '23:59',
              };

              const isToday = currentDayOfWeek === day.key;
              let timeLabel = `${dayData.openTime} - ${dayData.closeTime === '23:59' || dayData.closeTime === '00:00' ? 'Meia noite' : dayData.closeTime}`;
              if (!dayData.isOpen) {
                timeLabel = 'Fechado';
              }

              return (
                <div 
                  key={day.key}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isToday ? 'bg-blue-50/80 text-blue-900 font-black border border-blue-100' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{day.label}</span>
                  <span className={!dayData.isOpen ? 'text-gray-400 font-semibold' : 'text-gray-900 font-extrabold'}>
                    {timeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
