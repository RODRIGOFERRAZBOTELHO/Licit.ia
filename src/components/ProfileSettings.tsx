import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, UserCheck, Shield, CheckCircle, AlertTriangle, Save, Loader2, Sparkles } from 'lucide-react';
import { User } from '../types';
import { validateCNPJ, formatCNPJ, formatCEP, formatPhone } from '../utils/cnpjValidator';
import { useToast } from './Toast';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (updated: User) => void;
}

export function ProfileSettings({ user, onUpdateUser }: ProfileSettingsProps) {
  const [formData, setFormData] = useState<User>({ ...user });
  const [saving, setSaving] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const { success, error, info } = useToast();

  useEffect(() => {
    setFormData({ ...user });
    if (user.cnpj) {
      setCnpjValid(validateCNPJ(user.cnpj));
    }
  }, [user]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData((prev) => ({ ...prev, cnpj: formatted }));

    const raw = formatted.replace(/\D/g, '');
    if (raw.length === 14) {
      const isValid = validateCNPJ(formatted);
      setCnpjValid(isValid);
      if (!isValid) {
        error('CNPJ com dígitos verificadores matematicamente inválidos.', 'Validação de CNPJ');
      }
    } else {
      setCnpjValid(null);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData((prev) => ({ ...prev, cep: formatted }));

    const rawCep = formatted.replace(/\D/g, '');
    if (rawCep.length === 8) {
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        if (!res.ok) throw new Error('Não foi possível consultar o CEP.');
        const data = await res.json();

        if (data.erro) {
          error('CEP não localizado na base dos Correios.', 'ViaCEP');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
        success(`${data.localidade}/${data.uf} - Endereço preenchido automaticamente!`, 'ViaCEP Integrado');
      } catch (err: any) {
        error('Erro ao consultar ViaCEP.');
      } finally {
        setFetchingCep(false);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, telefone: formatPhone(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      error('Por favor, informe um CNPJ válido antes de salvar os dados oficiais.', 'CNPJ Inválido');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Erro ao salvar dados no servidor.');

      const data = await res.json();
      onUpdateUser(data.user);
      success('Dados cadastrais atualizados! O contexto da IA já foi sincronizado.', 'Perfil Atualizado');
    } catch (err: any) {
      error(err.message || 'Falha ao salvar dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                INJEÇÃO AUTOMÁTICA DE CONTEXTO JURÍDICO
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">Configuração dos Dados Cadastrais Oficiais</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Todos os dados preenchidos abaixo são injetados automaticamente pela Inteligência Artificial nos preâmbulos,
              qualificações e cabeçalhos de todos os 12 tipos de documentos gerados na plataforma.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Modo Atual</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user.role === 'admin' ? 'Administração Pública' : 'Licitante / Fornecedor'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Section 1: Instituição / Empresa */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Dados da Entidade / Empresa</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* CNPJ with Strict Validator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">CNPJ Oficial (com validação estrita)</label>
                {cnpjValid === true && (
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    CNPJ Válido
                  </span>
                )}
                {cnpjValid === false && (
                  <span className="text-[11px] font-medium text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Dígito Inválido
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.cnpj || ''}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={`w-full text-xs font-mono px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  cnpjValid === false
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                    : cnpjValid === true
                    ? 'border-emerald-400 focus:ring-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              <p className="text-[11px] text-slate-400 mt-1">Algoritmo módulo 11 de validação dos dígitos verificadores.</p>
            </div>

            {/* Razão Social / Órgão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formData.role === 'admin' ? 'Razão Social / Nome do Órgão Público' : 'Razão Social da Empresa'}
              </label>
              <input
                type="text"
                value={formData.razao_social || formData.orgao_publico || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    razao_social: e.target.value,
                    orgao_publico: e.target.value,
                  }))
                }
                placeholder={formData.role === 'admin' ? 'Ministério da Gestão / Prefeitura Municipal' : 'Tech Soluções e Comércio Ltda.'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Endereço & ViaCEP */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Endereço Completo & Integração ViaCEP</span>
            </div>
            {fetchingCep && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Consultando CEP...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {/* CEP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CEP (Busca Automática)</label>
              <input
                type="text"
                value={formData.cep || ''}
                onChange={handleCepChange}
                placeholder="00000-000"
                maxLength={9}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Logradouro */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logradouro / Avenida / Rua</label>
              <input
                type="text"
                value={formData.logradouro || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, logradouro: e.target.value }))}
                placeholder="Esplanada dos Ministérios, Bloco C"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={formData.numero || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                placeholder="1000 ou S/N"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Complemento</label>
              <input
                type="text"
                value={formData.complemento || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, complemento: e.target.value }))}
                placeholder="Sala 402, 3º Andar"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.bairro || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, bairro: e.target.value }))}
                placeholder="Zona Cívico-Administrativa"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.cidade || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                placeholder="Brasília"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* UF */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UF (Estado)</label>
              <input
                type="text"
                value={formData.uf || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                placeholder="DF"
                maxLength={2}
                className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Representante Legal & Contatos */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-semibold text-sm">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Representante Legal & Assinatura Formal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Nome Representante */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Representante Legal</label>
              <input
                type="text"
                value={formData.representante_legal || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, representante_legal: e.target.value }))}
                placeholder="Dr. Carlos Eduardo Mendonça"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Função Formal</label>
              <input
                type="text"
                value={formData.cargo_representante || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargo_representante: e.target.value }))}
                placeholder={formData.role === 'admin' ? 'Pregoeiro Oficial / Agente de Contratação' : 'Sócio-Diretor'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.telefone || ''}
                onChange={handlePhoneChange}
                placeholder="(61) 2020-1000"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gravando Alterações...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações Cadastrais</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
