import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Building2, Briefcase, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';
import { User, ProfileMode } from '../types';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const { success, error, info } = useToast();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<ProfileMode>('admin');
  const [cnpj, setCnpj] = useState('');
  const [orgaoOuRazao, setOrgaoOuRazao] = useState('');

  if (!isOpen) return null;

  const handleQuickMaster = async () => {
    setEmail('master@licitia.com');
    setPassword('master');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'master@licitia.com', password: 'master' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no login.');

      success('Conectado com credenciais de Administrador Master!', 'Acesso Irrevogável');
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no login.');

        success(`Bem-vindo de volta, ${data.user.name}!`);
        onLoginSuccess(data.user);
        onClose();
      } else if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            role,
            cnpj,
            razao_social: role === 'fornecedor' ? orgaoOuRazao : undefined,
            orgao_publico: role === 'admin' ? orgaoOuRazao : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no cadastro.');

        success('Conta criada com sucesso! Faça seu primeiro acesso.', 'Cadastro Concluído');
        onLoginSuccess(data.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao solicitar redefinição.');

        info('Enviamos as instruções para o seu e-mail.', 'Recuperação de Acesso');
        setMode('login');
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/30">
              L
            </div>
            <span className="font-bold text-lg tracking-tight">LicitIA - Smart Procure</span>
          </div>
          <h3 className="text-xl font-bold mt-2">
            {mode === 'login' && 'Acesse sua Conta'}
            {mode === 'register' && 'Cadastre-se na Plataforma'}
            {mode === 'forgot' && 'Recuperar Acesso'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'login' && 'Gerencie contratações e peças licitatórias com Inteligência Artificial'}
            {mode === 'register' && 'Inicie seus trabalhos com conformidade sob a Lei 14.133/2021'}
            {mode === 'forgot' && 'Digite seu e-mail para receber as instruções de recuperação'}
          </p>
        </div>

        {/* Master Account Bypass Quick Action */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Conta Master Admin:</span>
              <span className="font-mono ml-1 text-slate-700">master@licitia.com</span>
            </div>
          </div>
          <button
            onClick={handleQuickMaster}
            disabled={loading}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 rounded shadow-sm transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Autopreencher
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selecione seu Perfil de Atuação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    role === 'admin'
                      ? 'bg-blue-50 border-blue-600 text-blue-800 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Administração Pública
                </button>
                <button
                  type="button"
                  onClick={() => setRole('fornecedor')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    role === 'fornecedor'
                      ? 'bg-blue-50 border-blue-600 text-blue-800 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Licitante / Fornecedor
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou do responsável"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Profissional</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@orgao.gov.br ou empresa.com"
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Senha de Acesso</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {role === 'admin' ? 'Nome do Órgão / Secretaria' : 'Razão Social da Empresa'}
              </label>
              <input
                type="text"
                value={orgaoOuRazao}
                onChange={(e) => setOrgaoOuRazao(e.target.value)}
                placeholder={role === 'admin' ? 'Prefeitura Municipal / Secretaria de Gestão' : 'Tech Soluções Ltda.'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {mode === 'login' && 'Entrar no Sistema'}
            {mode === 'register' && 'Concluir Cadastro Grátis'}
            {mode === 'forgot' && 'Enviar Link de Recuperação'}
          </button>

          {/* Mode Switchers */}
          <div className="pt-2 text-center text-xs text-slate-500 space-y-1">
            {mode === 'login' && (
              <div>
                Não possui conta ainda?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Cadastre-se grátis
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div>
                Já possui conta cadastrada?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div>
                Lembrou da senha?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Voltar ao login
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
