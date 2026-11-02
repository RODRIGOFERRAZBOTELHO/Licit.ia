import React, { useState, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { PNCPItem } from '../types';
import { useToast } from './Toast';

interface PNCPRadarProps {
  onSelectTenderForAI: (tender: PNCPItem) => void;
}

export function PNCPRadar({ onSelectTenderForAI }: PNCPRadarProps) {
  const [tenders, setTenders] = useState<PNCPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const { success, error } = useToast();

  const fetchPNCP = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/pncp/search', window.location.origin);
      if (searchTerm) url.searchParams.set('termo', searchTerm);
      if (ufFilter) url.searchParams.set('uf', ufFilter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Não foi possível consultar a API do PNCP.');

      const data = await res.json();
      const rawList = data.data || [];
      const normalized = rawList.map((item: any) => ({
        numeroControlePNCP: item.numeroControlePNCP || `${item.orgaoEntidade?.cnpj || '00000000000100'}-${item.numeroCompra || '001'}`,
        numeroCompra: item.numeroCompra,
        anoCompra: item.anoCompra,
        modalidadeNome: item.modalidadeNome || item.modalidadeContratacaoNome || 'Pregão - Eletrônico',
        objeto: item.objeto || item.objetoCompra || 'Contratação de bens e serviços sob a Lei nº 14.133/2021',
        orgaoNome: item.orgaoNome || item.orgaoEntidade?.razaoSocial || 'Administração Pública Licitante',
        unidadeOrgaoNome: item.unidadeOrgaoNome || item.unidadeSubrogada?.nomeUnidade || '',
        uf: item.uf || item.unidadeOrgaoUf || item.orgaoEntidade?.uf || ufFilter || 'BR',
        valorTotalEstimado: item.valorTotalEstimado || item.valorTotalEstimadoInicial || item.valorTotalHomologado,
        dataPublicacaoPncp: item.dataPublicacaoPncp || item.dataInclusao,
        dataAberturaProposta: item.dataAberturaProposta || item.dataEncerramentoProposta,
        linkProcesso: item.linkProcesso || (item.numeroControlePNCP ? `https://pncp.gov.br/app/editais/${item.numeroControlePNCP}` : 'https://pncp.gov.br'),
      }));
      setTenders(normalized);
    } catch (err: any) {
      error(err.message || 'Erro ao carregar dados do PNCP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPNCP();
  }, [ufFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPNCP();
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Sigiloso / A apurar';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const UFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                DADOS ABERTOS OFICIAIS DO GOVERNO FEDERAL
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2 tracking-tight">
              Radar PNCP - Portal Nacional de Contratações Públicas
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consulte em tempo real licitações, pregões eletrônicos e dispensas de todo o Brasil sob a égide da Lei 14.133/2021.
              Importe qualquer oportunidade diretamente para os módulos de IA do LicitIA.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-white/10 px-4 py-3 rounded-xl border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold text-white">API Oficial PNCP</div>
              <div className="text-[11px] text-slate-300">pncp.gov.br</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o objeto, palavra-chave ou órgão (ex: software, veículos, obras, medicamentos)..."
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={ufFilter}
              onChange={(e) => setUfFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Estados (UF)</option>
              {UFs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Consultar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span>Exibindo {tenders.length} editais recentes encontrados</span>
          <button
            onClick={() => fetchPNCP()}
            className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar radar
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Consultando dados abertos do PNCP...</span>
          </div>
        ) : tenders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum edital encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Tente pesquisar com outros termos ou altere a UF selecionada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenders.map((tender, idx) => (
              <div
                key={tender.numeroControlePNCP || idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {tender.modalidadeNome || 'Pregão Eletrônico'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      UF: {tender.uf || 'Nacional'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {tender.objeto}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{tender.orgaoNome}</span>
                  </div>

                  {tender.unidadeOrgaoNome && (
                    <div className="text-[11px] text-slate-400 ml-5 truncate">
                      {tender.unidadeOrgaoNome}
                    </div>
                  )}

                  {/* Metadata Box */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valor Estimado</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(tender.valorTotalEstimado)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Abertura das Propostas</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {tender.dataAberturaProposta
                          ? new Date(tender.dataAberturaProposta).toLocaleDateString('pt-BR')
                          : 'A definir'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={tender.linkProcesso || 'https://pncp.gov.br'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
                  >
                    <span>Ver no PNCP</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => onSelectTenderForAI(tender)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Usar neste Edital</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
