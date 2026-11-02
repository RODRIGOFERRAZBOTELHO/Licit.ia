import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Save,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  BookOpen,
  FileDown,
} from 'lucide-react';
import { AIModuleDef, User, AttachmentFile } from '../types';
import { extractTextFromFile } from '../utils/fileExtractor';
import { generateAndDownloadDocx } from '../utils/docxExport';
import { generateAndDownloadPdf } from '../utils/pdfGenerator';
import { useToast } from './Toast';
import { PriceResearchWorkspace } from './PriceResearchWorkspace';

interface AIWorkspaceProps {
  module: AIModuleDef;
  user: User;
  onOpenPaywall: () => void;
  onDocumentSaved: () => void;
  initialPreset?: Record<string, string>;
}

export function AIWorkspace({ module, user, onOpenPaywall, onDocumentSaved, initialPreset }: AIWorkspaceProps) {
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Result state
  const [docTitle, setDocTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { success, error, info } = useToast();

  useEffect(() => {
    // Reset/initialize form inputs when module changes
    const initial: Record<string, string> = { ...module.defaultValues };
    if (initialPreset) {
      Object.assign(initial, initialPreset);
    }
    setFormInputs(initial);
    setDocTitle(`${module.name} - ${new Date().toLocaleDateString('pt-BR')}`);
    setGeneratedContent('');
  }, [module, initialPreset]);

  // Animated loading messages
  useEffect(() => {
    let interval: any;
    if (generating) {
      setGenerationStep(0);
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const loadingSteps = [
    'Analisando parâmetros da contratação e conformidade com a Lei 14.133/2021...',
    'Processando documentos de apoio anexados (PDF/DOCX/XLSX/Imagens)...',
    'Estruturando capítulos, cláusulas obrigatórias e fundamentação do TCU...',
    'Finalizando redação formal e calibrando formatação oficial...',
  ];

  const handleInputChange = (fieldId: string, value: string) => {
    setFormInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsExtracting(true);

    try {
      const files = Array.from(e.target.files);
      const extractedList: AttachmentFile[] = [];

      for (const file of files) {
        const item = await extractTextFromFile(file);
        extractedList.push(item);
      }

      setAttachments((prev) => [...prev, ...extractedList]);
      success(
        `${extractedList.length} arquivo(s) processado(s) e vinculado(s) ao contexto da IA!`,
        'Processamento Universal'
      );
    } catch (err: any) {
      error('Falha ao processar arquivo(s) selecionado(s).');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleGenerate = async () => {
    // Paywall Check
    const isMaster = user.email === 'master@licitia.com';
    if (!isMaster && !user.has_active_subscription) {
      info('Para acionar o motor de IA e gerar documentos, ative sua assinatura PRO.', 'Assinatura Necessária');
      onOpenPaywall();
      return;
    }

    setGenerating(true);

    // Concatenate text of all attachments
    const attachmentsText = attachments
      .map((a, i) => `--- ARQUIVO DE APOIO [${i + 1}]: ${a.name} (${a.type}) ---\n${a.text}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          moduleKey: module.key,
          moduleName: module.name,
          profileMode: module.targetRole,
          inputs: formInputs,
          userProfile: user,
          attachmentsText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'PAYWALL_RESTRICTION') {
          onOpenPaywall();
          return;
        }
        throw new Error(data.message || 'Erro na geração de IA.');
      }

      setGeneratedContent(data.text);
      setViewMode('preview');
      success('Documento gerado com pleno rigor sob a Lei 14.133/2021!', 'Peça Concluída');
    } catch (err: any) {
      error(err.message || 'Falha ao processar com o Gemini.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromPriceResearch = async (
    consolidatedText: string,
    basketItems: any[],
    totalEstimated: number
  ) => {
    const isMaster = user.email === 'master@licitia.com';
    if (!isMaster && !user.has_active_subscription) {
      info('Para acionar o motor de IA e gerar documentos, ative sua assinatura PRO.', 'Assinatura Necessária');
      onOpenPaywall();
      return;
    }

    setGenerating(true);
    setDocTitle(`Parecer Técnico de Pesquisa de Mercado (LicitAI) - ${new Date().toLocaleDateString('pt-BR')}`);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          moduleKey: 'pesquisa_preco',
          moduleName: 'Parecer Técnico de Pesquisa de Mercado (LicitAI - PNCP)',
          profileMode: module.targetRole,
          inputs: {
            itens: consolidatedText,
            fontes: 'Portal Nacional de Contratações Públicas (PNCP) - Processos Homologados nos últimos 180 dias.',
            parametros: 'IN SEGES/ME nº 65/2021 e Lei nº 14.133/2021 com análise de CV% e expurgo de sobrepreço.',
            valor_estimado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEstimated),
          },
          userProfile: user,
          attachmentsText: attachments.map((a, i) => `--- ANEXO [${i + 1}]: ${a.name} ---\n${a.text}`).join('\n\n'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PAYWALL_RESTRICTION') {
          onOpenPaywall();
          return;
        }
        throw new Error(data.message || 'Erro na geração de IA.');
      }

      setGeneratedContent(data.text);
      setViewMode('preview');
      success('Parecer Técnico de Pesquisa de Mercado emitido com sucesso pelo LicitAI!', 'LicitAI Concluído');
    } catch (err: any) {
      error(err.message || 'Falha ao processar com o LicitAI.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!generatedContent) return;
    setSavingDoc(true);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          title: docTitle || `${module.name} - ${new Date().toLocaleDateString('pt-BR')}`,
          moduleKey: module.key,
          moduleName: module.name,
          profileMode: module.targetRole,
          content: generatedContent,
          parameters: formInputs,
          attachments: attachments.map((a) => ({ name: a.name, size: a.size, type: a.type })),
        }),
      });

      if (!res.ok) throw new Error('Não foi possível gravar o documento.');

      success('Documento armazenado com segurança na sua Nuvem Privada!', 'Salvo com Sucesso');
      onDocumentSaved();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar na nuvem.');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleExportDocx = async () => {
    if (!generatedContent) return;
    try {
      success('Gerando arquivo Word formatado segundo padrões oficiais...', 'Exportação .DOCX');
      await generateAndDownloadDocx(
        docTitle || module.name,
        generatedContent,
        module.name,
        user
      );
      success('Arquivo .docx baixado com sucesso!');
    } catch (err: any) {
      error('Falha ao compilar documento .docx.');
    }
  };

  const handleExportPdf = async () => {
    if (!generatedContent) return;
    try {
      setExportingPdf(true);
      info('Gerando arquivo PDF oficial com quadro de coleta e memória de cálculo...', 'Exportação .PDF');
      await generateAndDownloadPdf(
        docTitle || module.name,
        generatedContent,
        module.name,
        user
      );
      success('Arquivo PDF emitido e baixado com sucesso!', 'PDF Concluído');
    } catch (err: any) {
      error('Falha ao compilar arquivo PDF oficial.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    success('Texto copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const wordCount = generatedContent ? generatedContent.trim().split(/\s+/).length : 0;
  const charCount = generatedContent ? generatedContent.length : 0;
  // Reusable Output Card
  const renderOutputCard = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[580px]">
      {/* Output Header Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Título do Documento"
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* View/Edit Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition ${
                viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              Visualizar
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1 transition ${
                viewMode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              Editar
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={!generatedContent}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition disabled:opacity-40 flex items-center gap-1"
            title="Copiar texto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* Save to Cloud */}
          <button
            onClick={handleSaveToCloud}
            disabled={!generatedContent || savingDoc}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition disabled:opacity-40 flex items-center gap-1"
            title="Salvar na Nuvem"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleExportPdf}
            disabled={!generatedContent || exportingPdf}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-40 flex items-center gap-1.5"
            title="Exportar em PDF Oficial Formatado (Quadro PNCP, Memória de Cálculo e Assinatura)"
          >
            {exportingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-rose-200" />
            )}
            <span>Baixar .PDF</span>
          </button>

          {/* Download DOCX */}
          <button
            onClick={handleExportDocx}
            disabled={!generatedContent}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-40 flex items-center gap-1.5"
            title="Exportar em Word .DOCX"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .DOCX</span>
          </button>
        </div>
      </div>

      {/* Meta status bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} palavras</span>
          <span>•</span>
          <span>{charCount} caracteres</span>
          <span>•</span>
          <span className="font-medium text-blue-700">Lei nº 14.133/2021</span>
        </div>
        <div className="text-slate-400 font-mono text-[10px]">
          {user.razao_social || user.orgao_publico || 'Perfil Não Configurado'}
        </div>
      </div>

      {/* Document Content Area / Skeleton Loader */}
      <div className="flex-1 p-6 relative">
        {generating ? (
          <div className="space-y-6 py-6 animate-pulse">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-spin">
                ⚡
              </div>
              <div>
                <div className="font-semibold text-blue-950">Inteligência Artificial LicitIA em Ação</div>
                <div className="text-blue-700 mt-0.5">{loadingSteps[generationStep]}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-6 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 rounded-md w-1/2" />
            </div>

            <div className="space-y-2 pt-4">
              <div className="h-4 bg-slate-200 rounded-md w-full" />
              <div className="h-4 bg-slate-200 rounded-md w-11/12" />
              <div className="h-4 bg-slate-200 rounded-md w-4/5" />
            </div>

            <div className="space-y-2 pt-4">
              <div className="h-5 bg-slate-200 rounded-md w-1/3" />
              <div className="h-4 bg-slate-200 rounded-md w-full" />
              <div className="h-4 bg-slate-200 rounded-md w-full" />
              <div className="h-4 bg-slate-200 rounded-md w-5/6" />
            </div>
          </div>
        ) : generatedContent ? (
          viewMode === 'edit' ? (
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="w-full h-full min-h-[500px] text-xs font-mono p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800"
            />
          ) : (
            <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-3 text-slate-800 font-sans">
              {generatedContent.split('\n\n').map((block, idx) => {
                if (block.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl font-bold text-slate-900 border-b pb-2 pt-3">
                      {block.replace(/^#\s+/, '')}
                    </h1>
                  );
                }
                if (block.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-blue-900 pt-3">
                      {block.replace(/^##\s+/, '')}
                    </h2>
                  );
                }
                if (block.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm font-semibold text-slate-800 pt-2">
                      {block.replace(/^###\s+/, '')}
                    </h3>
                  );
                }
                if (block.startsWith('- ') || block.startsWith('* ')) {
                  const items = block.split('\n');
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-1 text-slate-700 pl-2">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-slate-700 leading-relaxed text-justify">
                    {block}
                  </p>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[480px] text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Área de Redação da Peça</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Preencha os parâmetros ao lado, anexe documentos de apoio se desejar, e clique em{' '}
              <strong>"Gerar Peça Licitatória com IA"</strong> para redigir o documento completo sob a Lei 14.133/2021.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Exportação direta para Word (.docx)</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Injeção do seu CNPJ e Órgão</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Padrão jurisprudencial TCU</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Module Title & Legal Basis Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {module.badge}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-500" />
                {module.lawReference}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{module.name}</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{module.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFormInputs({ ...module.defaultValues })}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
              title="Restaurar parâmetros de exemplo padrão"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Exemplo Padrão
            </button>
          </div>
        </div>
      </div>

      {/* SPECIAL CASE: Pesquisa de Preço Estimada */}
      {module.key === 'pesquisa_preco' ? (
        <div className="space-y-6">
          <PriceResearchWorkspace
            user={user}
            generating={generating}
            onOpenPaywall={onOpenPaywall}
            onGenerateReport={handleGenerateFromPriceResearch}
          />

          {/* Render Output Document Card */}
          <div className="pt-2">{renderOutputCard()}</div>
        </div>
      ) : (
        /* STANDARD 11 MODULES: 2-Column Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Universal Files (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Module Specific Inputs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs pb-3 border-b border-slate-100 uppercase tracking-wider">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>Parâmetros da Peça Licitatória</span>
              </div>

              <div className="space-y-4">
                {module.fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                    </div>

                    {field.type === 'select' ? (
                      <select
                        value={formInputs[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={formInputs[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formInputs[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Universal File Upload Box (PDF, DOCX, XLSX, Images) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Documentos de Apoio (Universal)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">PDF, DOCX, XLSX, PNG/JPG</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Faça upload de editais, termos anteriores, planilhas orçamentárias ou memoriais. O texto é extraído e injetado como referência técnica obrigatória.
              </p>

              {/* Dropzone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition mb-1.5" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                  Clique para selecionar arquivos de apoio
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Suporta múltiplos documentos simultâneos</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={isExtracting}
                  className="hidden"
                />
              </label>

              {isExtracting && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Extraindo e indexando texto dos arquivos...</span>
                </div>
              )}

              {/* Uploaded Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Arquivos Vinculados ({attachments.length})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {att.name.endsWith('.xlsx') || att.name.endsWith('.xls') || att.name.endsWith('.csv') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : att.previewUrl ? (
                            <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-medium text-slate-800 truncate">{att.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {(att.size / 1024).toFixed(1)} KB • {att.text.length} caracteres extraídos
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trigger Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || isExtracting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-[0.99] disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processando com IA Jurídica...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar Peça Licitatória com IA</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: AI Output & Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">{renderOutputCard()}</div>
        </div>
      )}
    </div>
  );
}
