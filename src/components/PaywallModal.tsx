import React, { useState } from 'react';
import { X, Check, ShieldCheck, Zap, QrCode, Copy, Sparkles, CreditCard, Lock } from 'lucide-react';
import { useToast } from './Toast';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentApproved: () => void;
}

export function PaywallModal({ isOpen, onClose, onPaymentApproved }: PaywallModalProps) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const pixKeySimulated =
    '00020126580014br.gov.bcb.pix0136licitia-smart-procure-pagamentos-97reais520400005303986540597.005802BR5925LICITIA SMART PROCURE SAAS6009SAO PAULO62070503***63047D4F';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKeySimulated);
    setCopied(true);
    success('Código Pix Copia e Cola copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/subscription/simulate-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_demo',
        },
      });

      if (!res.ok) throw new Error('Falha ao processar simulação de pagamento.');

      const data = await res.json();
      success(data.message || 'Assinatura LicitIA PRO ativada com sucesso!', 'Mercado Pago Aprovado');
      onPaymentApproved();
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao simular pagamento.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              PLANO PROFISSIONAL ILIMITADO
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Desbloqueie o Motor de Inteligência Artificial do LicitIA
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Acesso completo aos 12 módulos jurídicos sob a Lei 14.133/2021, exportação irrestrita para Word (.docx), Radar PNCP e Jurisprudência TCU.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Price Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <div>
              <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Assinatura Mensal Recorrente</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-blue-950">R$ 97,00</span>
                <span className="text-sm font-medium text-slate-600">/mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Cancele quando quiser. Sem fidelidade contratual.</p>
            </div>

            <div className="mt-3 sm:mt-0 flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Checkout Seguro Mercado Pago</span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>8 Módulos Administração Pública</strong> (ETP, TR, Riscos, Pareceres)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>4 Módulos do Licitante</strong> (Propostas, Recursos, Contrarrazões)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>Exportação Direta em .DOCX</strong> (Word Oficial)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>Processamento Universal</strong> (PDF, DOCX, XLSX e Imagens)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>Radar PNCP</strong> em tempo real com links oficiais</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span><strong>Jurisprudência Selecionada do TCU</strong> da Nova Lei</span>
            </div>
          </div>

          {/* Payment Section (Mercado Pago Pix Simulator) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <div className="w-6 h-6 rounded bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                  MP
                </div>
                <span>Pagamento Instantâneo via Mercado Pago (PIX)</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Aprovação Imediata
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* QR Code Graphic */}
              <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center shrink-0">
                <div className="grid grid-cols-5 gap-1 w-full h-full p-1 border-2 border-dashed border-slate-300 rounded bg-slate-100/60">
                  <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                  <div className="bg-slate-400 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                  <div className="bg-slate-800 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-700 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                  <div className="bg-blue-600 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm col-span-2 row-span-2" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">PIX QR Code</span>
              </div>

              {/* Pix Copy & Paste */}
              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Pix Copia e Cola (Abra seu app do banco e selecione Pix Copia e Cola):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixKeySimulated}
                    className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Após a confirmação da transação pelo banco, a liberação ocorre instantaneamente.
                </div>
              </div>
            </div>
          </div>

          {/* Test Simulation Button Required by Specification */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Ambiente de Demonstração / Homologação:</span> Teste o fluxo completo de desbloqueio.
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={simulating}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Aprovando via Mercado Pago...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Simular Pagamento Aprovado</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
