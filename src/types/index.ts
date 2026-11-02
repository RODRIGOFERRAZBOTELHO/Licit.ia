export type ProfileMode = 'admin' | 'fornecedor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: ProfileMode;
  has_active_subscription: boolean;
  subscription_date?: string;
  cnpj?: string;
  razao_social?: string;
  orgao_publico?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  representante_legal?: string;
  cargo_representante?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  text: string;
  previewUrl?: string;
}

export interface SavedDocument {
  id: string;
  userId: string;
  title: string;
  moduleKey: string;
  moduleName: string;
  profileMode: ProfileMode;
  content: string;
  parameters: Record<string, any>;
  attachments: { name: string; size: number; type: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  help?: string;
  required?: boolean;
}

export interface AIModuleDef {
  key: string;
  name: string;
  shortName: string;
  targetRole: ProfileMode;
  lawReference: string;
  badge: string;
  description: string;
  iconName: string;
  fields: ModuleField[];
  defaultValues: Record<string, string>;
}

export interface PNCPItem {
  numeroControlePNCP: string;
  numeroCompra?: string;
  anoCompra?: number;
  modalidadeNome?: string;
  objeto: string;
  orgaoNome: string;
  unidadeOrgaoNome?: string;
  uf: string;
  municipioNome?: string;
  valorTotalEstimado?: number;
  dataPublicacaoPncp?: string;
  dataInclusao?: string;
  dataAberturaProposta?: string;
  linkProcesso?: string;
}

export interface TCUPrecedent {
  id: string;
  acordao: string;
  relator: string;
  processo: string;
  dataSessao: string;
  assunto: string;
  ementa: string;
  sumario: string;
  tags: string[];
}
