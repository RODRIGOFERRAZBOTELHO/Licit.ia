import React, { useState, useEffect } from 'react';
import { User, ProfileMode, AIModuleDef, PNCPItem, TCUPrecedent, SavedDocument } from './types';
import { AI_MODULES } from './data/modules';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AIWorkspace } from './components/AIWorkspace';
import { DocumentCloud } from './components/DocumentCloud';
import { PNCPRadar } from './components/PNCPRadar';
import { TCUJurisprudence } from './components/TCUJurisprudence';
import { ProfileSettings } from './components/ProfileSettings';
import { PaywallModal } from './components/PaywallModal';
import { AuthModal } from './components/AuthModal';

// Master Admin Default Account
const DEFAULT_USER: User = {
  id: 'usr_master',
  email: 'master@licitia.com',
  name: 'Administrador Master',
  role: 'admin',
  has_active_subscription: true,
  subscription_date: '2026-01-01',
  cnpj: '00.394.460/0058-87',
  razao_social: 'Ministério da Gestão e da Inovação em Serviços Públicos',
  orgao_publico: 'Secretaria de Gestão e Inovação (SEGES)',
  cep: '70040-010',
  logradouro: 'Esplanada dos Ministérios',
  numero: 'Bloco C',
  complemento: '3º Andar',
  bairro: 'Zona Cívico-Administrativa',
  cidade: 'Brasília',
  uf: 'DF',
  telefone: '(61) 2020-1000',
  representante_legal: 'Dr. Carlos Eduardo Mendonça',
  cargo_representante: 'Agente de Contratação / Presidente da CPL',
};

function MainApp() {
  const [user, setUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('licitia_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_USER;
  });

  const [currentTab, setCurrentTab] = useState<string>('workspace');
  const [selectedModule, setSelectedModule] = useState<AIModuleDef>(AI_MODULES[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialPreset, setInitialPreset] = useState<Record<string, string> | undefined>(undefined);

  const { success, info } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem('licitia_user', JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  // Handle Dual Mode switch
  const handleSwitchProfileMode = (mode: ProfileMode) => {
    const updated = { ...user, role: mode };
    setUser(updated);

    // If current module does not match the new mode, switch to the first valid module
    if (selectedModule.targetRole !== mode) {
      const firstValid = AI_MODULES.find((m) => m.targetRole === mode) || AI_MODULES[0];
      setSelectedModule(firstValid);
    }

    success(
      `Painel alternado para: ${mode === 'admin' ? 'Administração Pública' : 'Licitante / Fornecedor'}`,
      'Perfil Alternado'
    );
  };

  const handleSelectModule = (mod: AIModuleDef) => {
    setSelectedModule(mod);
    setInitialPreset(undefined);
    setCurrentTab('workspace');
  };

  // Import Tender from PNCP into AI Module
  const handleSelectTenderFromPNCP = (tender: PNCPItem) => {
    if (user.role === 'fornecedor') {
      const propModule = AI_MODULES.find((m) => m.key === 'proposta_comercial') || selectedModule;
      setSelectedModule(propModule);
      setInitialPreset({
        edital: `${tender.modalidadeNome || 'Pregão'} nº ${tender.numeroCompra || tender.numeroControlePNCP} - ${tender.orgaoNome}`,
        objeto: tender.objeto,
        valores: tender.valorTotalEstimado
          ? `Valor estimado pelo órgão: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              tender.valorTotalEstimado
            )}`
          : '',
      });
    } else {
      const etpModule = AI_MODULES.find((m) => m.key === 'etp') || selectedModule;
      setSelectedModule(etpModule);
      setInitialPreset({
        objeto: tender.objeto,
        necessidade: `Atendimento à demanda de contratação do órgão ${tender.orgaoNome}.`,
        valor_estimado: tender.valorTotalEstimado
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tender.valorTotalEstimado)
          : '',
      });
    }

    setCurrentTab('workspace');
    success('Dados do edital do PNCP importados para os parâmetros da IA!', 'Edital Vinculado');
  };

  // Insert TCU Precedent into AI
  const handleInsertTCUPrecedent = (precedent: TCUPrecedent) => {
    // Choose appropriate module
    let target = selectedModule;
    if (user.role === 'fornecedor') {
      target = AI_MODULES.find((m) => m.key === 'recurso_administrativo') || selectedModule;
    } else {
      target = AI_MODULES.find((m) => m.key === 'parecer_juridico') || selectedModule;
    }
    setSelectedModule(target);

    setInitialPreset((prev) => ({
      ...(prev || {}),
      argumentos: `${precedent.acordao} (Relator: ${precedent.relator}): ${precedent.sumario}`,
      pontos_controversos: `Aplicação do precedente ${precedent.acordao}: ${precedent.ementa}`,
    }));

    setCurrentTab('workspace');
    success(`Jurisprudência (${precedent.acordao}) inserida nos parâmetros da peça!`, 'TCU Vinculado');
  };

  const handleOpenDocInWorkspace = (doc: SavedDocument) => {
    const mod = AI_MODULES.find((m) => m.key === doc.moduleKey);
    if (mod) setSelectedModule(mod);
    setCurrentTab('workspace');
    info(`Documento "${doc.title}" aberto na área de trabalho.`);
  };

  const handlePaymentApproved = () => {
    setUser((prev) => ({
      ...prev,
      has_active_subscription: true,
      subscription_date: new Date().toISOString(),
    }));
  };

  const handleLogout = () => {
    // Switch to Demo Account
    const demoUser: User = {
      id: 'usr_demo',
      email: 'usuario@exemplo.com',
      name: 'Usuário Demonstração',
      role: 'admin',
      has_active_subscription: false,
      cnpj: '12.345.678/0001-90',
      razao_social: 'Prefeitura Municipal de Exemplo',
      orgao_publico: 'Secretaria Municipal de Administração',
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '(11) 3333-4444',
      representante_legal: 'Mariana Silva Santos',
      cargo_representante: 'Pregoeira Oficial',
    };
    setUser(demoUser);
    info('Você está no modo de demonstração. Entre como Master Admin a qualquer momento.', 'Sessão Finalizada');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedModuleKey={selectedModule.key}
        onSelectModule={handleSelectModule}
        profileMode={user.role}
        user={user}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPaywall={() => setIsPaywallOpen(true)}
          onSwitchProfileMode={handleSwitchProfileMode}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'workspace' && (
            <AIWorkspace
              module={selectedModule}
              user={user}
              onOpenPaywall={() => setIsPaywallOpen(true)}
              onDocumentSaved={() => {}}
              initialPreset={initialPreset}
            />
          )}

          {currentTab === 'cloud' && (
            <DocumentCloud
              user={user}
              onOpenDocumentInWorkspace={handleOpenDocInWorkspace}
            />
          )}

          {currentTab === 'pncp' && (
            <PNCPRadar onSelectTenderForAI={handleSelectTenderFromPNCP} />
          )}

          {currentTab === 'tcu' && (
            <TCUJurisprudence onInsertPrecedentToAI={handleInsertTCUPrecedent} />
          )}

          {currentTab === 'profile' && (
            <ProfileSettings user={user} onUpdateUser={setUser} />
          )}
        </main>
      </div>

      {/* Subscription Paywall Modal (Mercado Pago Simulator) */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onPaymentApproved={handlePaymentApproved}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(logged) => setUser(logged)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
