import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Percent,
  Sliders,
  FileDown,
  Info,
  Check,
  X,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Users,
  CheckSquare,
  Square,
  Building2,
} from 'lucide-react';
import { User } from '../types';
import { downloadBatchPriceTemplate, parseBatchPriceExcel, BatchPriceItem } from '../utils/excelBatchTemplate';
import { useToast } from './Toast';

export interface PNCPAmostra {
  id: string;
  itemNumero: number;
  fornecedor: string;
  cnpj: string;
  numeroContrato: string;
  orgao: string;
  modalidade: string;
  status: 'Homologado';
  dataHomologacao: string;
  diasDecorridos: number;
  marcaModelo: string;
  objeto: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  linkContrato: string;
  linkPncp: string;
  situacao: 'Mantido' | 'Expurgado (Inexequível)' | 'Expurgado (Sobrepreço)';
  selecionado: boolean;
  justificativaExpurgo?: string;
}

interface PriceResearchWorkspaceProps {
  user: User;
  onGenerateReport: (consolidatedText: string, basketItems: any[], totalEstimated: number) => void;
  onOpenPaywall: () => void;
  generating: boolean;
}

export function PriceResearchWorkspace({
  user,
  onGenerateReport,
  onOpenPaywall,
  generating,
}: PriceResearchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'pncp' | 'lote'>('pncp');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('notebook');
  const [objetoDescricao, setObjetoDescricao] = useState(
    'Aquisição de microcomputadores portáteis tipo Notebook corporativo 14 polegadas com garantia on-site de 36 meses.'
  );
  const [isSearchingPNCP, setIsSearchingPNCP] = useState(false);
  const [amostras, setAmostras] = useState<PNCPAmostra[]>([]);

  // Monetary Adjustment (IPCA/IBGE for samples > 6 months)
  const [aplicarIPCA, setAplicarIPCA] = useState(false);
  const [taxaIPCA, setTaxaIPCA] = useState<number>(2.85); // 2.85% default accumulated

  // Manual addition modal or inline form
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualFornecedor, setManualFornecedor] = useState('');
  const [manualCnpj, setManualCnpj] = useState('');
  const [manualContrato, setManualContrato] = useState('');
  const [manualMarca, setManualMarca] = useState('');
  const [manualPreco, setManualPreco] = useState<number | ''>('');
  const [manualQtd, setManualQtd] = useState<number>(10);
  const [manualLinkContrato, setManualLinkContrato] = useState('https://pncp.gov.br');
  const [manualLinkPncp, setManualLinkPncp] = useState('https://pncp.gov.br');

  // Criteria selection for final reference price
  const [criterioAdotado, setCriterioAdotado] = useState<'automatica' | 'mediana' | 'media' | 'menor'>('automatica');

  // Batch Tab state
  const [batchItems, setBatchItems] = useState<BatchPriceItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchFileName, setBatchFileName] = useState('');

  // Supplier filter search within results
  const [supplierFilterSearch, setSupplierFilterSearch] = useState('');

  const { success, error, info } = useToast();

  // Load PNCP samples on mount or search
  const fetchPNCPAmostras = async (termo: string) => {
    setIsSearchingPNCP(true);
    try {
      const res = await fetch(`/api/pncp/amostras?termo=${encodeURIComponent(termo)}`);
      if (res.ok) {
        const data = await res.json();
        const rawList = data.data || [];
        const formatted: PNCPAmostra[] = rawList.map((item: any, idx: number) => ({
          ...item,
          itemNumero: idx + 1,
          selecionado: item.situacao === 'Mantido',
        }));
        setAmostras(formatted);
        if (formatted.length > 0 && formatted[0].objeto) {
          setObjetoDescricao(formatted[0].objeto);
        }
      }
    } catch (err) {
      console.error('Error fetching PNCP samples:', err);
    } finally {
      setIsSearchingPNCP(false);
    }
  };

  useEffect(() => {
    fetchPNCPAmostras('notebook');
  }, []);

  // Quick Chips
  const quickChips = [
    { label: 'Notebook Corporativo', term: 'notebook' },
    { label: 'Cadeira NR-17', term: 'cadeira' },
    { label: 'Monitor LED 4K', term: 'monitor' },
    { label: 'Veículo Furgão', term: 'veiculo' },
    { label: 'Papel Sulfite A4', term: 'papel' },
    { label: 'Limpeza Predial', term: 'limpeza' },
  ];

  // Helper: compute effective price with optional IPCA
  const getPrecoEfetivo = (a: PNCPAmostra) => {
    if (aplicarIPCA && a.diasDecorridos > 180) {
      return Number((a.precoUnitario * (1 + taxaIPCA / 100)).toFixed(2));
    }
    return a.precoUnitario;
  };

  // Active / Selected Samples
  const amostrasAtivas = amostras.filter((a) => a.selecionado && a.situacao === 'Mantido');
  const amostrasExpurgadas = amostras.filter((a) => a.selecionado && a.situacao !== 'Mantido');

  // --- STATISTICAL CALCULATIONS ---
  const precosSaneados = amostrasAtivas.map(getPrecoEfetivo);
  precosSaneados.sort((a, b) => a - b);

  const n = precosSaneados.length;
  const menorPreco = n > 0 ? precosSaneados[0] : 0;
  const maiorPreco = n > 0 ? precosSaneados[n - 1] : 0;

  const soma = precosSaneados.reduce((acc, curr) => acc + curr, 0);
  const mediaSimples = n > 0 ? Number((soma / n).toFixed(2)) : 0;

  const meio = Math.floor(n / 2);
  const mediana =
    n > 0
      ? n % 2 === 0
        ? Number(((precosSaneados[meio - 1] + precosSaneados[meio]) / 2).toFixed(2))
        : precosSaneados[meio]
      : 0;

  // Standard Deviation (s) and Coefficient of Variation (CV%)
  let desvioPadrao = 0;
  if (n > 1) {
    const somaQuadrados = precosSaneados.reduce((acc, p) => acc + Math.pow(p - mediaSimples, 2), 0);
    desvioPadrao = Number(Math.sqrt(somaQuadrados / (n - 1)).toFixed(2));
  }

  const cv = mediaSimples > 0 ? Number(((desvioPadrao / mediaSimples) * 100).toFixed(2)) : 0;
  const isAmostraHomogenea = cv <= 25.0;

  // Effective reference price chosen
  let precoReferenciaUnitario = mediaSimples;
  let metodoNome = 'Média Simples (Amostra Homogênea)';

  if (criterioAdotado === 'mediana' || (criterioAdotado === 'automatica' && !isAmostraHomogenea)) {
    precoReferenciaUnitario = mediana;
    metodoNome = 'Mediana (IN SEGES/ME nº 65/2021)';
  } else if (criterioAdotado === 'menor') {
    precoReferenciaUnitario = menorPreco;
    metodoNome = 'Menor Preço Válido';
  } else {
    precoReferenciaUnitario = mediaSimples;
    metodoNome = 'Média Simples Saneada';
  }

  const quantidadeTotalObjeto = amostrasAtivas.length > 0 ? amostrasAtivas[0].quantidade : 1;
  const valorTotalReferencial = Number((precoReferenciaUnitario * quantidadeTotalObjeto).toFixed(2));

  // Filtered samples for quick supplier chips
  const filteredAmostrasForChips = amostras.filter((a) => {
    if (!supplierFilterSearch) return true;
    const term = supplierFilterSearch.toLowerCase();
    return (
      a.fornecedor.toLowerCase().includes(term) ||
      a.cnpj.toLowerCase().includes(term) ||
      a.marcaModelo.toLowerCase().includes(term) ||
      a.orgao.toLowerCase().includes(term)
    );
  });

  // --- ACTIONS ---

  // Toggle sample selection
  const handleToggleSample = (id: string) => {
    setAmostras((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selecionado: !a.selecionado } : a))
    );
  };

  // Select all suppliers and prices
  const handleSelectAllSuppliers = () => {
    setAmostras((prev) => prev.map((a) => ({ ...a, selecionado: true })));
    success('Todos os fornecedores e preços foram selecionados para a cesta de cálculo.');
  };

  // Deselect all suppliers
  const handleDeselectAllSuppliers = () => {
    setAmostras((prev) => prev.map((a) => ({ ...a, selecionado: false })));
    info('Todos os fornecedores foram desmarcados.');
  };

  // Select only homologated samples without outliers
  const handleSelectOnlyMantidos = () => {
    setAmostras((prev) => prev.map((a) => ({ ...a, selecionado: a.situacao === 'Mantido' })));
    success('Apenas cotações homologadas sem sobrepreço foram selecionadas.');
  };

  // Invert supplier selection
  const handleInvertSupplierSelection = () => {
    setAmostras((prev) => prev.map((a) => ({ ...a, selecionado: !a.selecionado })));
    success('Seleção de fornecedores invertida.');
  };

  // Change sample situation
  const handleChangeSituacao = (
    id: string,
    novaSituacao: 'Mantido' | 'Expurgado (Inexequível)' | 'Expurgado (Sobrepreço)'
  ) => {
    setAmostras((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        let just = a.justificativaExpurgo || '';
        if (novaSituacao === 'Expurgado (Sobrepreço)') {
          just = `Art. 3º, § 4º da IN SEGES/ME nº 65/2021: Expurgo técnico fundamentado de amostra apresentando valor desproporcional (+${(
            ((a.precoUnitario - mediana) / (mediana || 1)) *
            100
          ).toFixed(1)}% acima da mediana do PNCP), com indício manifesto de sobrepreço.`;
        } else if (novaSituacao === 'Expurgado (Inexequível)') {
          just = `Art. 3º, § 4º da IN SEGES/ME nº 65/2021: Expurgo técnico fundamentado de amostra com valor manifestamente inexequível (-${(
            ((mediana - a.precoUnitario) / (mediana || 1)) *
            100
          ).toFixed(1)}% abaixo da mediana do PNCP), incompatível com a média de custos praticada no certame.`;
        } else {
          just = '';
        }
        return {
          ...a,
          situacao: novaSituacao,
          justificativaExpurgo: just,
        };
      })
    );
    success('Situação da amostra alterada e justificativa legal atualizada.');
  };

  // Automatic Saneamento of Outliers (Art. 3º, § 4º da IN 65/2021)
  const handleAutoSanitizeOutliers = () => {
    if (amostras.length === 0) return;

    // Use current median of all selected
    const allPrices = amostras.filter((a) => a.selecionado).map((a) => a.precoUnitario);
    if (allPrices.length === 0) return;
    allPrices.sort((a, b) => a - b);
    const m = allPrices[Math.floor(allPrices.length / 2)];

    let expurgadosCount = 0;
    const updated = amostras.map((a) => {
      if (!a.selecionado) return a;
      const variacao = (a.precoUnitario - m) / m;

      // > 30% above median -> Sobrepreço
      if (variacao > 0.3) {
        expurgadosCount++;
        return {
          ...a,
          situacao: 'Expurgado (Sobrepreço)' as const,
          justificativaExpurgo: `Art. 3º, § 4º da IN SEGES/ME nº 65/2021: Expurgo automático de valor excessivo (+${(
            variacao * 100
          ).toFixed(1)}% acima da mediana apurada no PNCP), caracterizando manifesto indício de sobrepreço.`,
        };
      }
      // < 45% of median -> Inexequível
      if (variacao < -0.45) {
        expurgadosCount++;
        return {
          ...a,
          situacao: 'Expurgado (Inexequível)' as const,
          justificativaExpurgo: `Art. 3º, § 4º da IN SEGES/ME nº 65/2021: Expurgo automático de valor inexequível (${(
            variacao * 100
          ).toFixed(1)}% abaixo da mediana do PNCP), sem viabilidade econômica demonstrada.`,
        };
      }
      return {
        ...a,
        situacao: 'Mantido' as const,
        justificativaExpurgo: '',
      };
    });

    setAmostras(updated);
    if (expurgadosCount > 0) {
      success(
        `${expurgadosCount} amostra(s) com variação atípica foram expurgadas com fundamentação jurídica automática.`,
        'Saneamento Concluído'
      );
    } else {
      info('Nenhuma amostra discrepante identificada. A amostragem atual está balanceada.', 'Amostragem Válida');
    }
  };

  // Add manual sample
  const handleAddManualSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFornecedor || !manualPreco) {
      error('Preencha pelo menos a Razão Social e o Preço Unitário.');
      return;
    }

    const precoNum = typeof manualPreco === 'number' ? manualPreco : parseFloat(manualPreco);
    const newAmostra: PNCPAmostra = {
      id: `manual_${Date.now()}`,
      itemNumero: amostras.length + 1,
      fornecedor: manualFornecedor,
      cnpj: manualCnpj || '00.000.000/0001-00',
      numeroContrato: manualContrato || `Contrato nº ${Math.floor(10 + Math.random() * 90)}/2025`,
      orgao: 'Órgão Licitante (Amostra Manual PNCP)',
      modalidade: 'Pregão Eletrônico',
      status: 'Homologado',
      dataHomologacao: new Date().toLocaleDateString('pt-BR'),
      diasDecorridos: 10,
      marcaModelo: manualMarca || 'Padrão de Mercado',
      objeto: objetoDescricao,
      unidade: 'UNIDADE',
      quantidade: manualQtd,
      precoUnitario: precoNum,
      precoTotal: Number((precoNum * manualQtd).toFixed(2)),
      linkContrato: manualLinkContrato,
      linkPncp: manualLinkPncp,
      situacao: 'Mantido',
      selecionado: true,
      justificativaExpurgo: '',
    };

    setAmostras((prev) => [...prev, newAmostra]);
    setShowAddManualModal(false);
    setManualFornecedor('');
    setManualCnpj('');
    setManualContrato('');
    setManualMarca('');
    setManualPreco('');
    success('Amostra adicional inserida com sucesso no Quadro de Coleta!');
  };

  // Handle batch file upload in Tab 2
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingBatch(true);
    setBatchFileName(file.name);

    try {
      const items = await parseBatchPriceExcel(file);
      setBatchItems(items);
      success(`${items.length} itens importados e calculados da planilha!`, 'Importação em Lote');
    } catch (err: any) {
      error(err.message || 'Erro ao processar planilha de lote.');
    } finally {
      setIsProcessingBatch(false);
      e.target.value = '';
    }
  };

  // Trigger report generation with LicitAI
  const handleTriggerAI = () => {
    const isMaster = user.email === 'master@licitia.com';
    if (!isMaster && !user.has_active_subscription) {
      info('Para emitir o Parecer Técnico pericial com IA, ative sua assinatura PRO.');
      onOpenPaywall();
      return;
    }

    if (activeTab === 'pncp' && amostrasAtivas.length === 0) {
      error('Selecione ou mantenha pelo menos 1 amostra válida no quadro consolidado.');
      return;
    }

    if (activeTab === 'lote' && batchItems.length === 0) {
      error('Importe uma planilha de lote preenchida antes de gerar o relatório.');
      return;
    }

    // Build markdown table for prompt
    let markdownTable = `| Item | Fornecedor | CNPJ | Nº Contrato / ARP | Marca / Modelo | Qtd | Preço Unit. (R$) | Preço Total (R$) | Contrato | Link PNCP | Situação Amostra |\n|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

    amostras.forEach((a, i) => {
      const precoEf = getPrecoEfetivo(a);
      const totalEf = Number((precoEf * a.quantidade).toFixed(2));
      const formattedUnit = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoEf);
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEf);
      markdownTable += `| ${String(i + 1).padStart(2, '0')} | ${a.fornecedor} | ${a.cnpj} | ${a.numeroContrato} | ${
        a.marcaModelo
      } | ${a.quantidade} | ${formattedUnit} | ${formattedTotal} | [Baixar Contrato](${a.linkContrato}) | [Página PNCP](${
        a.linkPncp
      }) | ${a.situacao} |\n`;
    });

    const expurgosTexto =
      amostrasExpurgadas.length > 0
        ? amostrasExpurgadas
            .map(
              (e) =>
                `- Amostra #${e.itemNumero} (${e.fornecedor} - R$ ${e.precoUnitario}): ${
                  e.justificativaExpurgo || 'Expurgo fundamentado no art. 3º, § 4º da IN 65/2021.'
                }`
            )
            .join('\n')
        : 'Nenhuma amostra expurgada. Todos os preços mantiveram-se dentro da margem de coerência estatística.';

    const statusCV = isAmostraHomogenea
      ? `Amostra Homogênea (CV = ${cv.toFixed(2)}% <= 25%)`
      : `Amostra Dispersa (CV = ${cv.toFixed(2)}% > 25%)`;

    const sobreprecoConclusao = isAmostraHomogenea
      ? 'NÃO APRESENTA INDÍCIOS DE SOBREPREÇO'
      : 'APRESENTA INDÍCIOS DE SOBREPREÇO (Requer adoção obrigatória da Mediana)';

    const promptConsolidado = `QUADRO CONSOLIDADO DE COLETA (PNCP - ÚLTIMOS 180 DIAS - HOMOLOGADOS):
Objeto da Análise: ${objetoDescricao}
Índice de Reajuste Aplicado: ${aplicarIPCA ? `IPCA/IBGE (${taxaIPCA}% acumulado para contratos > 180 dias)` : 'Nenhum'}

${markdownTable}

MEMÓRIA DE CÁLCULO E AMBIENTE ESTATÍSTICO:
- Menor Preço Encontrado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(menorPreco)}
- Média Simples (Amostra Saneada): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      mediaSimples
    )}
- Mediana (Amostra Saneada): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediana)}
- Desvio Padrão da Amostra (s): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      desvioPadrao
    )}
- Coeficiente de Variação (CV): ${cv.toFixed(2)}% — [Status: ${statusCV}]
- Detalhamento dos Expurgos:
${expurgosTexto}

DIAGNÓSTICO E ANÁLISE DE MERCADO:
- Conclusão Preliminar: ${sobreprecoConclusao}
- Critério Recomendado: ${metodoNome}
- Valor Unitário Estimado de Referência: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(precoReferenciaUnitario)}
- Quantidade Contratada Prevista: ${quantidadeTotalObjeto}
- Valor Total Estimado da Contratação: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valorTotalReferencial)}

Por favor, elabore o Parecer Técnico de Pesquisa de Mercado completo e pericial seguindo rigorosamente a estrutura oficial das 5 seções do LicitAI.`;

    onGenerateReport(promptConsolidado, amostrasAtivas, valorTotalReferencial);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex items-center gap-2">
        <button
          onClick={() => setActiveTab('pncp')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'pncp'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>LicitAI - Parecer Técnico de Pesquisa de Mercado (PNCP)</span>
        </button>

        <button
          onClick={() => setActiveTab('lote')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'lote'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Cotação de Itens por Lote (Planilha Modelo .XLSX)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: LICITAI - PARECER TÉCNICO DE PESQUISA DE MERCADO (PNCP) */}
      {/* ============================================================== */}
      {activeTab === 'pncp' && (
        <div className="space-y-6">
          {/* Top Banner & Search */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    LicitAI • Motor Pericial de Custos
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Status: Homologado Exclusivo
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    Janela: Últimos 180 Dias
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-2 text-white">
                  Parecer Técnico de Pesquisa de Mercado no PNCP
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Extração automática de contratações públicas homologadas nos últimos 180 dias com rastreabilidade direta ao contrato PDF original, cálculo de dispersão estatística (CV%) e saneamento de outliers fundamentado na IN SEGES/ME nº 65/2021.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="px-3.5 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl border border-blue-500/40 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Amostra Manual</span>
                </button>
              </div>
            </div>

            {/* Search Input & Quick Chips */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPNCPAmostras(searchTerm)}
                    placeholder="Pesquisar objeto no PNCP (ex: notebook, monitor, cadeira, furgão, limpeza, papel A4)..."
                    className="w-full text-xs pl-9 pr-24 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => fetchPNCPAmostras(searchTerm)}
                    disabled={isSearchingPNCP}
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSearchingPNCP ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Buscar PNCP</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400 mr-1">Consultas frequentes:</span>
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchTerm(chip.term);
                      fetchPNCPAmostras(chip.term);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      searchTerm === chip.term
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Object Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Objeto Licitatório em Análise:
            </label>
            <input
              type="text"
              value={objetoDescricao}
              onChange={(e) => setObjetoDescricao(e.target.value)}
              placeholder="Descreva minuciosamente o bem ou serviço em análise..."
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* Tools Bar: Outliers Treatment & Monetary Adjustment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAutoSanitizeOutliers}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Identifica e propõe o expurgo de valores inexequíveis ou com indício de sobrepreço sob o art. 3º, § 4º da IN 65/2021"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Saneamento Automático de Outliers (IN 65/2021)</span>
              </button>

              {/* IPCA Adjustment Toggle */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <input
                  type="checkbox"
                  id="toggleIpca"
                  checked={aplicarIPCA}
                  onChange={(e) => setAplicarIPCA(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="toggleIpca" className="cursor-pointer font-medium text-slate-700 select-none">
                  Atualização Monetária (IPCA &gt; 6 meses)
                </label>
                {aplicarIPCA && (
                  <div className="flex items-center gap-1 pl-1">
                    <input
                      type="number"
                      step="0.01"
                      value={taxaIPCA}
                      onChange={(e) => setTaxaIPCA(parseFloat(e.target.value) || 0)}
                      className="w-14 text-xs font-mono font-bold px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Criteria Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Preço de Referência:</span>
              <select
                value={criterioAdotado}
                onChange={(e: any) => setCriterioAdotado(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="automatica">Automático (Regra de CV% da IN 65)</option>
                <option value="mediana">Mediana Saneada</option>
                <option value="media">Média Simples Saneada</option>
                <option value="menor">Menor Preço Válido</option>
              </select>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. QUADRO CONSOLIDADO DE COLETA (PNCP)                         */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  2. Quadro Consolidado de Coleta (PNCP)
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {amostras.length} fornecedores / amostras encontradas
                </span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  {amostrasAtivas.length} ativos no cálculo
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Selecione ou desmarque fornecedores e preços para calibrar a memória estatística oficial.
              </div>
            </div>

            {/* PAINEL DE SELEÇÃO RÁPIDA DE FORNECEDORES E PREÇOS */}
            {amostras.length > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                          Painel de Seleção de Fornecedores e Preços
                        </h3>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                          {amostrasAtivas.length} de {amostras.length} selecionados
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Clique nos fornecedores abaixo ou utilize os botões rápidos para incluir ou excluir cotações da amostra.
                      </p>
                    </div>
                  </div>

                  {/* Batch Selection Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllSuppliers}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                      title="Seleciona todos os fornecedores e cotações encontradas"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Selecionar Todos ({amostras.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectOnlyMantidos}
                      className="px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 text-xs font-semibold rounded-lg border border-emerald-500/30 transition flex items-center gap-1"
                      title="Seleciona apenas cotações homologadas sem sobrepreço ou valores atípicos"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apenas Homologados ({amostras.filter((a) => a.situacao === 'Mantido').length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInvertSupplierSelection}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
                      title="Inverte a seleção atual"
                    >
                      Inverter
                    </button>

                    <button
                      type="button"
                      onClick={handleDeselectAllSuppliers}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                      title="Desmarca todos os fornecedores"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Quick Search within Found Suppliers */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={supplierFilterSearch}
                      onChange={(e) => setSupplierFilterSearch(e.target.value)}
                      placeholder="Filtrar fornecedor por razão social, CNPJ ou marca homologada..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {supplierFilterSearch && (
                    <button
                      type="button"
                      onClick={() => setSupplierFilterSearch('')}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                {/* Grid of Interactive Supplier Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                  {filteredAmostrasForChips.map((a) => {
                    const precoEf = getPrecoEfetivo(a);
                    return (
                      <div
                        key={a.id}
                        onClick={() => handleToggleSample(a.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 select-none ${
                          a.selecionado
                            ? a.situacao === 'Mantido'
                              ? 'bg-blue-950/60 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                              : 'bg-rose-950/40 border-rose-500/60 text-slate-200'
                            : 'bg-slate-800/30 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-90'
                        }`}
                        title="Clique para incluir/excluir este fornecedor e preço da pesquisa"
                      >
                        <input
                          type="checkbox"
                          checked={a.selecionado}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSample(a.id);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-bold text-xs truncate text-white" title={a.fornecedor}>
                              {a.fornecedor}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                a.situacao === 'Mantido'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {a.situacao === 'Mantido' ? 'Homologado' : 'Expurgado'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400 font-mono">
                            <span className="truncate max-w-[110px]">{a.cnpj}</span>
                            <span className="font-bold text-white text-xs">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoEf)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {amostras.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isSearchingPNCP ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Consultando contratações homologadas no PNCP...</span>
                  </div>
                ) : (
                  <span>Nenhuma contratação localizada. Tente pesquisar outro termo acima.</span>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center" title="Selecionar ou desmarcar todos os fornecedores e preços">
                        <input
                          type="checkbox"
                          checked={amostras.length > 0 && amostras.every((a) => a.selecionado)}
                          onChange={() => {
                            const allSelected = amostras.length > 0 && amostras.every((a) => a.selecionado);
                            setAmostras((prev) => prev.map((a) => ({ ...a, selecionado: !allSelected })));
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Fornecedor / CNPJ</th>
                      <th className="py-2.5 px-3">Nº Contrato / ARP</th>
                      <th className="py-2.5 px-3">Marca / Modelo Homologado</th>
                      <th className="py-2.5 px-3">Qtd</th>
                      <th className="py-2.5 px-3">Preço Unit. (R$)</th>
                      <th className="py-2.5 px-3">Preço Total (R$)</th>
                      <th className="py-2.5 px-3">Rastreabilidade</th>
                      <th className="py-2.5 px-3">Situação da Amostra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAmostrasForChips.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum fornecedor localizado com o filtro &quot;{supplierFilterSearch}&quot;.
                          <button
                            type="button"
                            onClick={() => setSupplierFilterSearch('')}
                            className="text-blue-600 hover:text-blue-700 underline font-semibold ml-2 cursor-pointer"
                          >
                            Exibir todos os fornecedores
                          </button>
                        </td>
                      </tr>
                    )}
                    {filteredAmostrasForChips.map((a, idx) => {
                      const precoEf = getPrecoEfetivo(a);
                      const totalEf = Number((precoEf * a.quantidade).toFixed(2));
                      const isOver6Months = a.diasDecorridos > 180;

                      return (
                        <tr
                          key={a.id}
                          className={`hover:bg-slate-50/80 transition ${
                            !a.selecionado || a.situacao !== 'Mantido' ? 'opacity-60 bg-slate-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={a.selecionado}
                              onChange={() => handleToggleSample(a.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{a.fornecedor}</div>
                            <div className="font-mono text-[10px] text-slate-500">{a.cnpj}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{a.orgao}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800">{a.numeroContrato}</span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>Homologado: {a.dataHomologacao}</span>
                              {isOver6Months && (
                                <span className="text-amber-700 bg-amber-50 px-1 rounded text-[9px] font-bold">
                                  &gt;6m
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <div className="font-semibold text-slate-800 line-clamp-1" title={a.marcaModelo}>
                              {a.marcaModelo}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{a.objeto}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {a.quantidade} {a.unidade}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoEf)}
                            {aplicarIPCA && isOver6Months && (
                              <span className="block text-[9px] font-normal text-emerald-600">
                                IPCA +{taxaIPCA}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEf)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              <a
                                href={a.linkContrato}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                              >
                                <FileDown className="w-3 h-3 text-blue-500" />
                                <span>[Baixar Contrato]</span>
                              </a>
                              <a
                                href={a.linkPncp}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>[Página PNCP]</span>
                              </a>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={a.situacao}
                              onChange={(e: any) => handleChangeSituacao(a.id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition ${
                                a.situacao === 'Mantido'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : a.situacao === 'Expurgado (Sobrepreço)'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Mantido">Mantido</option>
                              <option value="Expurgado (Sobrepreço)">Expurgado (Sobrepreço)</option>
                              <option value="Expurgado (Inexequível)">Expurgado (Inexequível)</option>
                            </select>
                            {a.justificativaExpurgo && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-1" title={a.justificativaExpurgo}>
                                {a.justificativaExpurgo}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 3. AMBIENTE ESTATÍSTICO E MEMÓRIA DE CÁLCULO                   */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" />
                <span>3. Ambiente Estatístico e Memória de Cálculo (IN 65/2021)</span>
              </span>
              <span className="text-xs text-slate-500">
                Amostras consideradas: <strong>{amostrasAtivas.length}</strong> | Expurgadas: <strong>{amostrasExpurgadas.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Menor Preço</span>
                <span className="font-bold text-slate-900 text-base font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(menorPreco)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Média Simples (Saneada)</span>
                <span className="font-bold text-blue-900 text-base font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediaSimples)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mediana (Saneada)</span>
                <span className="font-bold text-slate-900 text-base font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediana)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Desvio Padrão (s)</span>
                <span className="font-bold text-slate-700 text-base font-mono">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desvioPadrao)}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isAmostraHomogenea
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/70 border-amber-300'
                }`}
              >
                <span className="text-[10px] text-slate-600 uppercase font-bold block">Coeficiente Variação (CV)</span>
                <span
                  className={`font-black text-base font-mono ${
                    isAmostraHomogenea ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {cv.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Dynamic CV% Alert Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                isAmostraHomogenea
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}
            >
              {isAmostraHomogenea ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block text-sm">
                  {isAmostraHomogenea
                    ? `Amostra Homogênea (CV = ${cv.toFixed(2)}% <= 25%)`
                    : `Amostra Dispersa / Heterogênea (CV = ${cv.toFixed(2)}% > 25%)`}
                </span>
                <p className="mt-0.5">
                  {isAmostraHomogenea
                    ? 'A variação entre as cotações homologadas encontra-se dentro do limite de tolerância legal. Valida-se estatisticamente a adoção da MÉDIA SIMPLES como preço referencial da contratação.'
                    : 'Em observância ao Art. 3º e Art. 6º da IN SEGES/ME nº 65/2021, diante de variação atípica superior a 25%, recomenda-se formalmente a adoção da MEDIANA como parâmetro balizador do valor de referência.'}
                </p>
              </div>
            </div>

            {/* Justifications of Expurgated Samples */}
            {amostrasExpurgadas.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Fundamentação Técnica e Jurídica dos Expurgos Realizados:
                </span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {amostrasExpurgadas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-rose-700 shrink-0">Item #{a.itemNumero}:</span>
                      <div>
                        <strong>{a.fornecedor}</strong> ({a.marcaModelo}) —{' '}
                        <span>{a.justificativaExpurgo || 'Expurgo com base na IN 65/2021.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 4. ANÁLISE PREDITIVA DE SOBREPREÇO & 5. RECOMENDAÇÃO FINAL     */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 4. Sobrepreço */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>4. Análise Preditiva de Sobrepreço</span>
              </span>

              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isAmostraHomogenea
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {isAmostraHomogenea ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block uppercase tracking-wider">Conclusão de Análise</span>
                  <span className="text-sm font-extrabold">
                    {isAmostraHomogenea
                      ? 'NÃO APRESENTA INDÍCIOS DE SOBREPREÇO'
                      : 'INDÍCIO DE DISPERSÃO (MEDIANA RECOMENDADA)'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                A amostragem de contratações homologadas no Portal Nacional de Contratações Públicas (PNCP) nos últimos 180 dias reflete a realidade das licitações federais e estaduais com ampla concorrência.
              </p>
            </div>

            {/* 5. Recomendação Final */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>5. Recomendação e Valor Referencial</span>
                </span>
                <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {metodoNome}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[10px] text-blue-200 uppercase block">Valor Unitário</span>
                  <span className="text-lg font-black font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      precoReferenciaUnitario
                    )}
                  </span>
                </div>

                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[10px] text-blue-200 uppercase block">Total do Lote/Objeto</span>
                  <span className="text-lg font-black font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      valorTotalReferencial
                    )}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleTriggerAI}
                disabled={generating || amostrasAtivas.length === 0}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Redigindo Parecer com LicitAI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Gerar Parecer Técnico de Pesquisa de Mercado (LicitAI)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: ITENS POR LOTE - PLANILHA MODELO DOWNLOAD & UPLOAD      */}
      {/* ============================================================== */}
      {activeTab === 'lote' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  COTAÇÃO EM MASSA POR LOTE
                </span>
                <h3 className="text-xl font-bold mt-2">Planilha Modelo de Pesquisa de Preços em Lote</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Baixe nossa planilha modelo oficial em Excel (.xlsx), insira dezenas ou centenas de itens com suas cotações e faça o upload para processamento imediato com cálculos de médias e medianas.
                </p>
              </div>

              {/* Download Model Button */}
              <button
                type="button"
                onClick={downloadBatchPriceTemplate}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>Baixar Planilha Modelo (.XLSX)</span>
              </button>
            </div>

            {/* Dropzone */}
            <div className="pt-4 border-t border-slate-800">
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-400 hover:bg-white/5 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition mb-2" />
                <span className="text-xs font-semibold text-white">
                  {batchFileName
                    ? `Arquivo Carregado: ${batchFileName}`
                    : 'Clique para enviar a planilha de lote preenchida (.xlsx/.csv)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Processamento instantâneo de médias saneadas, medianas e totais estimados
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBatchUpload}
                  disabled={isProcessingBatch}
                  className="hidden"
                />
              </label>

              {isProcessingBatch && (
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/40 text-xs text-blue-200 flex items-center justify-center gap-2 mt-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Calculando estatísticas e médias da planilha...</span>
                </div>
              )}
            </div>
          </div>

          {/* Batch Items Table */}
          {batchItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">
                  Itens Importados da Planilha de Lote ({batchItems.length} itens)
                </span>
                <button
                  type="button"
                  onClick={handleTriggerAI}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Parecer para o Lote</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Descrição</th>
                      <th className="py-2 px-3">Qtd</th>
                      <th className="py-2 px-3">Média Saneada</th>
                      <th className="py-2 px-3">Mediana</th>
                      <th className="py-2 px-3">Total Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchItems.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{b.itemNumero}</td>
                        <td className="py-2 px-3 font-mono text-blue-700">{b.codigoCatmat || '-'}</td>
                        <td className="py-2 px-3 max-w-xs truncate" title={b.descricao}>
                          {b.descricao}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {b.quantidade} {b.unidade}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            b.mediaSaneada
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            b.mediana
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            b.totalEstimado
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Sample Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Inserir Amostra do PNCP Manualmente</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualSample} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social do Fornecedor *</label>
                <input
                  type="text"
                  required
                  value={manualFornecedor}
                  onChange={(e) => setManualFornecedor(e.target.value)}
                  placeholder="Ex: Fabricante ou Distribuidor Oficial Ltda."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ do Fornecedor</label>
                  <input
                    type="text"
                    value={manualCnpj}
                    onChange={(e) => setManualCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Contrato ou ARP</label>
                  <input
                    type="text"
                    value={manualContrato}
                    onChange={(e) => setManualContrato(e.target.value)}
                    placeholder="Contrato nº 55/2025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Marca / Modelo Homologado</label>
                <input
                  type="text"
                  value={manualMarca}
                  onChange={(e) => setManualMarca(e.target.value)}
                  placeholder="Ex: Dell Latitude 5440 ou Marca X Modelo Y"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Unitário Homologado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualPreco}
                    onChange={(e) => setManualPreco(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={manualQtd}
                    onChange={(e) => setManualQtd(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Download Contrato PDF</label>
                  <input
                    type="url"
                    value={manualLinkContrato}
                    onChange={(e) => setManualLinkContrato(e.target.value)}
                    placeholder="https://pncp.gov.br/contrato.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link Página no PNCP</label>
                  <input
                    type="url"
                    value={manualLinkPncp}
                    onChange={(e) => setManualLinkPncp(e.target.value)}
                    placeholder="https://pncp.gov.br/edital/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition"
                >
                  Adicionar Amostra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
