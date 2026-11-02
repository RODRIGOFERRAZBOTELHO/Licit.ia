import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  Eye,
  X,
  Copy,
  Check,
  Edit3,
  Save,
  Filter,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { SavedDocument, User } from '../types';
import { generateAndDownloadDocx } from '../utils/docxExport';
import { generateAndDownloadPdf } from '../utils/pdfGenerator';
import { useToast } from './Toast';

interface DocumentCloudProps {
  user: User;
  onOpenDocumentInWorkspace: (doc: SavedDocument) => void;
}

export function DocumentCloud({ user, onOpenDocumentInWorkspace }: DocumentCloudProps) {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  const { success, error } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/documents', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (selectedModule !== 'all') url.searchParams.set('moduleKey', selectedModule);
      if (selectedRole !== 'all') url.searchParams.set('profileMode', selectedRole);

      const res = await fetch(url.toString(), {
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) throw new Error('Falha ao carregar documentos.');

      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      error('Erro ao listar documentos salvos na nuvem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, selectedModule, selectedRole]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este documento da sua Nuvem Privada?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) throw new Error('Não foi possível excluir o documento.');

      setDocuments((prev) => prev.filter((d) => d.id !== id));
      success('Documento excluído da Nuvem Privada.');
      if (previewDoc?.id === id) setPreviewDoc(null);
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleDownloadDocx = async (doc: SavedDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      success('Compilando Word oficial...', 'Exportação .DOCX');
      await generateAndDownloadDocx(doc.title, doc.content, doc.moduleName, user);
      success('Arquivo .docx baixado!');
    } catch (err: any) {
      error('Falha ao gerar arquivo DOCX.');
    }
  };

  const handleDownloadPdf = async (doc: SavedDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      success('Compilando PDF oficial...', 'Exportação .PDF');
      await generateAndDownloadPdf(doc.title, doc.content, doc.moduleName, user);
      success('Arquivo PDF baixado com sucesso!');
    } catch (err: any) {
      error('Falha ao gerar arquivo PDF.');
    }
  };

  const handleOpenPreview = (doc: SavedDocument) => {
    setPreviewDoc(doc);
    setEditedContent(doc.content);
    setEditedTitle(doc.title);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!previewDoc) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/documents/${previewDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar alterações no documento.');

      const data = await res.json();
      setPreviewDoc(data.document);
      setDocuments((prev) => prev.map((d) => (d.id === data.document.id ? data.document : d)));
      setIsEditing(false);
      success('Documento atualizado na Nuvem Privada!', 'Edição Salva');
    } catch (err: any) {
      error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCopyPreview = () => {
    if (!previewDoc) return;
    navigator.clipboard.writeText(isEditing ? editedContent : previewDoc.content);
    setCopied(true);
    success('Texto copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                ARMAZENAMENTO SEGURO
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">Nuvem de Documentos</h1>
            <p className="text-xs text-slate-500 mt-1">
              Repositório persistente de todas as peças e minutas geradas com inteligência artificial sob a Nova Lei de Licitações.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {documents.length} documento(s) salvo(s)
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou palavras-chave na peça..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Perfis</option>
              <option value="admin">Administração Pública</option>
              <option value="fornecedor">Licitante / Fornecedor</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Módulos</option>
              <option value="etp">Estudo Técnico Preliminar (ETP)</option>
              <option value="tr">Termo de Referência (TR)</option>
              <option value="mapa_risco">Mapa de Risco</option>
              <option value="pesquisa_preco">Pesquisa de Preço</option>
              <option value="minuta_contrato">Minuta Contratual</option>
              <option value="parecer_juridico">Parecer Jurídico</option>
              <option value="autuacao_despacho">Autuação do Processo</option>
              <option value="decisao_recursal">Decisão Recursal</option>
              <option value="proposta_comercial">Proposta Comercial</option>
              <option value="declaracoes_unificadas">Declarações Unificadas</option>
              <option value="recurso_administrativo">Recurso Administrativo</option>
              <option value="contrar_razoes">Contrarrazões Recursais</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Carregando sua Nuvem Privada...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Nenhum documento encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gere uma nova peça nos módulos de IA ou ajuste os filtros de pesquisa acima para visualizar seus arquivos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenPreview(doc)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      doc.profileMode === 'admin'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {doc.profileMode === 'admin' ? 'Administração Pública' : 'Licitante'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                  {doc.title}
                </h3>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{doc.moduleName}</div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed font-sans">
                  {doc.content.replace(/[#*_-]/g, '').substring(0, 150)}...
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {doc.content.trim().split(/\s+/).length} palavras
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDownloadPdf(doc, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Baixar em PDF oficial (.pdf)"
                  >
                    <FileDown className="w-4 h-4 text-rose-500" />
                  </button>

                  <button
                    onClick={(e) => handleDownloadDocx(doc, e)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Baixar em Word (.docx)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Excluir da Nuvem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Document Preview & Rich Edit Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-semibold text-white focus:outline-none"
                  />
                ) : (
                  <div>
                    <h3 className="text-sm font-bold truncate">{previewDoc.title}</h3>
                    <div className="text-[11px] text-slate-400">
                      {previewDoc.moduleName} • {new Date(previewDoc.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar inside Modal */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1 ${
                    isEditing
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Visualizar' : 'Editar'}</span>
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                )}

                <button
                  onClick={handleCopyPreview}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(previewDoc)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                  title="Baixar em PDF Oficial"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-200" />
                  <span>Baixar .PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadDocx(previewDoc)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                  title="Baixar em Word .DOCX"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .DOCX</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full min-h-[500px] text-xs font-mono p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800 shadow-inner"
                />
              ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-xs leading-relaxed space-y-3 font-sans text-slate-800 max-w-3xl mx-auto">
                  {previewDoc.content.split('\n\n').map((block, idx) => {
                    if (block.startsWith('# ')) {
                      return (
                        <h1 key={idx} className="text-xl font-bold text-slate-900 border-b pb-2 pt-2">
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
