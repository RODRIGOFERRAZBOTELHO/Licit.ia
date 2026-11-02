import React from 'react';
import {
  FileText,
  FileCheck,
  ShieldAlert,
  TrendingUp,
  FileSignature,
  Scale,
  FolderPlus,
  Gavel,
  Receipt,
  FileBadge,
  ShieldCheck,
  Cloud,
  Radar,
  UserCog,
  Zap,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { AIModuleDef, ProfileMode, User } from '../types';
import { AI_MODULES } from '../data/modules';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  selectedModuleKey: string;
  onSelectModule: (module: AIModuleDef) => void;
  profileMode: ProfileMode;
  user: User;
  onOpenPaywall: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  selectedModuleKey,
  onSelectModule,
  profileMode,
  user,
  onOpenPaywall,
  isOpen,
  onClose,
}: SidebarProps) {
  // Filter modules based on active dual-mode profile
  const filteredModules = AI_MODULES.filter((m) => m.targetRole === profileMode);

  // Icon mapping helper
  const renderModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'FileCheck':
        return <FileCheck className="w-4 h-4" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4" />;
      case 'FileSignature':
        return <FileSignature className="w-4 h-4" />;
      case 'Scale':
        return <Scale className="w-4 h-4" />;
      case 'FolderPlus':
        return <FolderPlus className="w-4 h-4" />;
      case 'Gavel':
        return <Gavel className="w-4 h-4" />;
      case 'Receipt':
        return <Receipt className="w-4 h-4" />;
      case 'FileBadge':
        return <FileBadge className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const isPro = user.email === 'master@licitia.com' || user.has_active_subscription;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-slate-300 flex flex-col z-40 transition-transform duration-300 ease-in-out border-r border-slate-800 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & App Identity */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20">
              L
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>LicitIA</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30 font-semibold">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Smart Procure • Lei 14.133</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Active Profile Mode Indicator */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Painel Ativo</div>
            <div className="font-bold text-white mt-0.5 flex items-center justify-between">
              <span>{profileMode === 'admin' ? 'Administração Pública' : 'Licitante / Fornecedor'}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                {filteredModules.length} Módulos
              </span>
            </div>
          </div>

          {/* Specialized AI Modules Section */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Módulos Especializados ({profileMode === 'admin' ? 'Órgão Licitante' : 'Visão da Empresa'})
            </div>

            {filteredModules.map((m) => {
              const isActive = currentTab === 'workspace' && selectedModuleKey === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    onSelectTab('workspace');
                    onSelectModule(m);
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`}>
                      {renderModuleIcon(m.iconName)}
                    </span>
                    <span className="truncate">{m.shortName}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </button>
              );
            })}
          </div>

          {/* Integrated Government Tools & Database */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recursos & Integrações
            </div>

            <button
              onClick={() => {
                onSelectTab('cloud');
                onClose();
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                currentTab === 'cloud'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>Nuvem de Documentos</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('pncp');
                onClose();
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                currentTab === 'pncp'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Radar className="w-4 h-4 text-emerald-400" />
              <span>Radar de Editais (PNCP)</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('tcu');
                onClose();
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                currentTab === 'tcu'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Jurisprudência do TCU</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('profile');
                onClose();
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                currentTab === 'profile'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCog className="w-4 h-4 text-amber-400" />
              <span>Dados Cadastrais & CNPJ</span>
            </button>
          </div>
        </div>

        {/* Bottom Subscription Banner */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          {!isPro ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border border-blue-500/30 text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assinatura LicitIA PRO</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Libere todos os 12 módulos de IA por apenas <strong>R$ 97,00/mês</strong> via Mercado Pago.
              </p>
              <button
                onClick={onOpenPaywall}
                className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200" />
                <span>Assinar Agora</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Assinatura Ativa</span>
                <span className="text-[10px] text-emerald-400">Acesso Completo Irrestrito</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
