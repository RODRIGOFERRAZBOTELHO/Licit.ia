import React from 'react';
import {
  Building2,
  Briefcase,
  Sparkles,
  Zap,
  ShieldCheck,
  UserCheck,
  LogIn,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { User, ProfileMode } from '../types';

interface HeaderProps {
  user: User;
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  onOpenPaywall: () => void;
  onSwitchProfileMode: (mode: ProfileMode) => void;
  onLogout: () => void;
}

export function Header({
  user,
  onToggleSidebar,
  onOpenAuth,
  onOpenPaywall,
  onSwitchProfileMode,
  onLogout,
}: HeaderProps) {
  const isMaster = user.email === 'master@licitia.com';
  const isPro = isMaster || user.has_active_subscription;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Brand in mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dual Mode Switcher (Pill Selector in Header) */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
          <button
            onClick={() => onSwitchProfileMode('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              user.role === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Administração Pública</span>
            <span className="sm:hidden">Órgão</span>
          </button>

          <button
            onClick={() => onSwitchProfileMode('fornecedor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              user.role === 'fornecedor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Licitante / Fornecedor</span>
            <span className="sm:hidden">Licitante</span>
          </button>
        </div>
      </div>

      {/* Right: Subscription Badge & User Profile */}
      <div className="flex items-center gap-3">
        {/* Subscription Status Pill */}
        {isPro ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">
              {isMaster ? 'Master Admin (Irrevogável)' : 'Plano PRO Ativo'}
            </span>
            <span className="sm:hidden">PRO</span>
          </div>
        ) : (
          <button
            onClick={onOpenPaywall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition animate-pulse"
          >
            <Zap className="w-3.5 h-3.5 text-amber-200" />
            <span>Assinar PRO (R$ 97/mês)</span>
          </button>
        )}

        {/* User Dropdown / Status */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
              {user.email}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenAuth}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              title="Trocar de Conta / Fazer Login"
            >
              <UserCheck className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
