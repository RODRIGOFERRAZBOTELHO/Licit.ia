import React, { useState, useEffect } from 'react';
import {
  Search,
  Scale,
  BookOpen,
  Copy,
  Check,
  Calendar,
  User,
  Tag,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { TCUPrecedent } from '../types';
import { useToast } from './Toast';

interface TCUJurisprudenceProps {
  onInsertPrecedentToAI?: (precedent: TCUPrecedent) => void;
}

export function TCUJurisprudence({ onInsertPrecedentToAI }: TCUJurisprudenceProps) {
  const [precedents, setPrecedents] = useState<TCUPrecedent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchPrecedents = async (query = '') => {
    setLoading(true);
    try {
      const url = new URL('/api/tcu/search', window.location.origin);
      if (query) url.searchParams.set('termo', query);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Não foi possível consultar os precedentes do TCU.');

      const data = await res.json();
      setPrecedents(data.jurisprudencias || []);
    } catch (err: any) {
      error(err.message || 'Erro ao consultar jurisprudência do TCU.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrecedents(searchTerm);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrecedents(searchTerm);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      fetchPrecedents('');
    } else {
      setSelectedTag(tag);
      fetchPrecedents(tag);
    }
  };

  const handleCopyCitation = (item: TCUPrecedent) => {
    const citationText = `[JURISPRUDÊNCIA DO TCU - ${item.acordao}]\nRelator: ${item.relator} | Processo: ${item.processo} | Data da Sessão: ${item.dataSessao}\nAssunto: ${item.assunto}\nEmenta: "${item.ementa}"\nSumário: ${item.sumario}`;

    navigator.clipboard.writeText(citationText);
    setCopiedId(item.id);
    success('Citação oficial e ementa do TCU copiadas para a área de transferência!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const popularTags = ['ETP', 'Pesquisa de Preços', 'Habilitação', 'Saneamento', 'Recurso', 'Artigo 18', 'Artigo 23', 'Artigo 64'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-300" />
                CONTROLE EXTERNO & SEGURANÇA JURÍDICA
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2 tracking-tight">
              Jurisprudência Selecionada do TCU - Lei 14.133/2021
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pesquise acórdãos paradigmáticos do Tribunal de Contas da União para embasar pareceres jurídicos, termos de referência,
              justificativas de preços, recursos administrativos e decisões recursais com segurança incontestável.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-white/10 px-4 py-3 rounded-xl border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold text-white">Base Oficial TCU</div>
              <div className="text-[11px] text-slate-300">Tribunal de Contas da União</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 pt-5 border-t border-slate-800 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por assunto, artigo da lei ou termo (ex: pesquisa de preços, ETP, saneamento, diligência)..."
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Buscar</span>
          </button>
        </form>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Temas Frequentes:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition ${
                selectedTag === tag
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Precedents Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span>{precedents.length} acórdão(s) selecionado(s)</span>
          <a
            href="https://pesquisa.apps.tcu.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Portal de Jurisprudência do TCU</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Consultando jurisprudência do TCU...</span>
          </div>
        ) : precedents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum precedente localizado</h3>
            <p className="text-xs text-slate-400 mt-1">Ajuste os termos de pesquisa ou selecione uma das tags temáticas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {precedents.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">{item.acordao}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.relator}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.dataSessao}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-600">{item.processo}</span>
                  </div>
                </div>

                {/* Assunto & Ementa */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">{item.assunto}</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed font-serif italic">
                    "{item.ementa}"
                  </div>
                </div>

                {/* Sumário */}
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Sumário da Tese:</strong> {item.sumario}
                </div>

                {/* Tags & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyCitation(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Citação Copiada' : 'Copiar Citação'}</span>
                    </button>

                    {onInsertPrecedentToAI && (
                      <button
                        onClick={() => onInsertPrecedentToAI(item)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Usar no Gerador de Peça</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
