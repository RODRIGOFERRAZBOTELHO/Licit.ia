import * as XLSX from 'xlsx';

export interface BatchPriceItem {
  itemNumero: number;
  codigoCatmat?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  fonte1Valor?: number;
  fonte1Nome?: string;
  fonte2Valor?: number;
  fonte2Nome?: string;
  fonte3Valor?: number;
  fonte3Nome?: string;
  mediaSaneada: number;
  mediana: number;
  precoMinimo: number;
  precoMaximo: number;
  totalEstimado: number;
  fontesValidasCount: number;
  avisoIncongruencia?: string;
}

/**
 * Gera e realiza o download imediato da planilha modelo oficial (.xlsx)
 * para realização de pesquisa de preços de itens por lote conforme a IN 65/2021.
 */
export function downloadBatchPriceTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Aba de Cotação de Itens por Lote
  const headers = [
    'Item',
    'Codigo_CATMAT_CATSER',
    'Descricao_Item',
    'Unidade_Medida',
    'Quantidade',
    'Fonte_1_Preco_Unitario_R$',
    'Fonte_1_Orgao_Ou_Fornecedor',
    'Fonte_2_Preco_Unitario_R$',
    'Fonte_2_Orgao_Ou_Fornecedor',
    'Fonte_3_Preco_Unitario_R$',
    'Fonte_3_Orgao_Ou_Fornecedor',
  ];

  const sampleRows = [
    [
      1,
      'CATMAT-482910',
      'Notebook Corporativo 14 pol, Processador i7/Ryzen 7, 16GB RAM, SSD 512GB, Garantia 36 meses',
      'UNIDADE',
      25,
      4850.0,
      'Tribunal Superior Eleitoral (TSE) - Pregão nº 42/2025',
      4620.0,
      'Ministério da Gestão e Inovação (MGI) - Pregão nº 19/2025',
      5200.0,
      'TRT 2ª Região - Pregão nº 08/2026',
    ],
    [
      2,
      'CATMAT-150244',
      'Cadeira Giratória Ergonômica Presidente com espaldar em tela mesh e laudo NR-17',
      'UNIDADE',
      40,
      750.0,
      'TJSP - Pregão nº 99/2024',
      690.0,
      'PGR / MPF - Pregão nº 24/2025',
      840.0,
      'SEFAZ/RJ - Pregão nº 03/2025',
    ],
    [
      3,
      'CATMAT-230911',
      'Papel Sulfite A4 75g/m² alcalino branco pacote com 500 folhas (resma)',
      'RESMA',
      200,
      24.0,
      'Câmara dos Deputados - Pregão nº 11/2025',
      22.8,
      'Prefeitura de Campinas - Pregão nº 36/2025',
      26.7,
      'Secretaria da Educação SP - Pregão nº 102/2025',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Definir larguras de colunas para formatação profissional
  ws['!cols'] = [
    { wch: 6 }, // Item
    { wch: 18 }, // Código CATMAT
    { wch: 45 }, // Descrição
    { wch: 15 }, // Unidade
    { wch: 12 }, // Quantidade
    { wch: 22 }, // Fonte 1 Preço
    { wch: 35 }, // Fonte 1 Nome
    { wch: 22 }, // Fonte 2 Preço
    { wch: 35 }, // Fonte 2 Nome
    { wch: 22 }, // Fonte 3 Preço
    { wch: 35 }, // Fonte 3 Nome
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cotação_Lote_Preços');

  // 2. Aba com Instruções Formais sob a IN SEGES/ME nº 65/2021
  const instrucoes = [
    ['INSTRUÇÕES DE PREENCHIMENTO - PESQUISA DE PREÇOS EM LOTE (LEI 14.133/2021 & IN SEGES 65/2021)'],
    [''],
    ['1. COMPOSIÇÃO DAS FONTES E COTAÇÕES:'],
    ['- Os itens podem conter uma ou mais fontes de preços (Fontes 1, 2, 3 ou mais).'],
    ['- Fontes recomendadas: Painel de Preços, compras públicas homologadas, contratações similares e orçamentos de fornecedores.'],
    [''],
    ['2. VIGÊNCIA DAS HOMOLOGAÇÕES:'],
    ['- Os preços coletados de contratações públicas devem ter sido homologados nos últimos 24 (vinte e quatro) meses.'],
    [''],
    ['3. VALORES DISCREPANTES OU INEXEQUÍVEIS:'],
    ['- O LicitIA calcula automaticamente a Média Saneada e a Mediana para as cotações informadas.'],
    [''],
    ['4. COMO IMPORTAR:'],
    ['- Preencha os itens e cotações na aba "Cotação_Lote_Preços", salve o arquivo e faça o upload no sistema.'],
  ];

  const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
  wsInstrucoes['!cols'] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções_IN65_2021');

  // Gerar e disparar download
  XLSX.writeFile(wb, 'Modelo_LicitIA_Pesquisa_Precos_Lote.xlsx');
}

/**
 * Processa a planilha de cotação de lote enviada pelo usuário (.xlsx/.csv),
 * higieniza os dados e calcula a média saneada e a mediana por item.
 */
export async function parseBatchPriceExcel(file: File): Promise<BatchPriceItem[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Converter para array de objetos (ou matriz)
  const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
  if (rows.length < 2) {
    throw new Error('A planilha está vazia ou não contém linhas de dados além do cabeçalho.');
  }

  // Identificar cabeçalho
  const headerRow = rows[0] as string[];
  const findColIndex = (keywords: string[]) => {
    return headerRow.findIndex((h) => {
      if (!h) return false;
      const cleanH = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some((kw) => cleanH.includes(kw));
    });
  };

  const colItem = findColIndex(['item']);
  const colCatmat = findColIndex(['codigo', 'catmat', 'catser']);
  const colDesc = findColIndex(['descricao', 'objeto', 'especificacao']);
  const colUnid = findColIndex(['unidade', 'und', 'medida']);
  const colQtd = findColIndex(['quantidade', 'qtd']);

  const colF1Val = findColIndex(['fonte1preco', 'preco1', 'fonte1']);
  const colF1Nome = findColIndex(['fonte1orgao', 'fonte1fornecedor', 'orgao1', 'fornecedor1']);
  const colF2Val = findColIndex(['fonte2preco', 'preco2', 'fonte2']);
  const colF2Nome = findColIndex(['fonte2orgao', 'fonte2fornecedor', 'orgao2', 'fornecedor2']);
  const colF3Val = findColIndex(['fonte3preco', 'preco3', 'fonte3']);
  const colF3Nome = findColIndex(['fonte3orgao', 'fonte3fornecedor', 'orgao3', 'fornecedor3']);

  const parsedItems: BatchPriceItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!row || row.length === 0) continue;

    const desc = row[colDesc !== -1 ? colDesc : 2];
    if (!desc || String(desc).trim().length === 0) continue;

    const itemNumero = Number(row[colItem !== -1 ? colItem : 0]) || i;
    const catmat = colCatmat !== -1 && row[colCatmat] ? String(row[colCatmat]).trim() : undefined;
    const unidade = colUnid !== -1 && row[colUnid] ? String(row[colUnid]).trim().toUpperCase() : 'UNIDADE';
    const quantidade = Number(row[colQtd !== -1 ? colQtd : 4]) || 1;

    // Extrair valores numéricos de preços
    const parseNumber = (val: any): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'number') return isNaN(val) ? undefined : val;
      const clean = String(val).replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? undefined : num;
    };

    const p1 = parseNumber(row[colF1Val !== -1 ? colF1Val : 5]);
    const f1Nome = colF1Nome !== -1 && row[colF1Nome] ? String(row[colF1Nome]).trim() : undefined;

    const p2 = parseNumber(row[colF2Val !== -1 ? colF2Val : 7]);
    const f2Nome = colF2Nome !== -1 && row[colF2Nome] ? String(row[colF2Nome]).trim() : undefined;

    const p3 = parseNumber(row[colF3Val !== -1 ? colF3Val : 9]);
    const f3Nome = colF3Nome !== -1 && row[colF3Nome] ? String(row[colF3Nome]).trim() : undefined;

    const precosValidos = [p1, p2, p3].filter((p): p is number => p !== undefined && p > 0);
    precosValidos.sort((a, b) => a - b);

    let mediaSaneada = 0;
    let mediana = 0;
    let precoMinimo = 0;
    let precoMaximo = 0;

    if (precosValidos.length > 0) {
      precoMinimo = precosValidos[0];
      precoMaximo = precosValidos[precosValidos.length - 1];

      // Média aritmética
      const soma = precosValidos.reduce((acc, curr) => acc + curr, 0);
      mediaSaneada = Number((soma / precosValidos.length).toFixed(2));

      // Mediana
      const meio = Math.floor(precosValidos.length / 2);
      mediana =
        precosValidos.length % 2 === 0
          ? Number(((precosValidos[meio - 1] + precosValidos[meio]) / 2).toFixed(2))
          : precosValidos[meio];
    }

    const totalEstimado = Number((mediaSaneada * quantidade).toFixed(2));
    let avisoIncongruencia: string | undefined = undefined;
    if (precosValidos.length === 0) {
      avisoIncongruencia = 'Nenhum valor válido informado para este item.';
    }

    parsedItems.push({
      itemNumero,
      codigoCatmat: catmat,
      descricao: String(desc).trim(),
      unidade,
      quantidade,
      fonte1Valor: p1,
      fonte1Nome: f1Nome,
      fonte2Valor: p2,
      fonte2Nome: f2Nome,
      fonte3Valor: p3,
      fonte3Nome: f3Nome,
      mediaSaneada,
      mediana,
      precoMinimo,
      precoMaximo,
      totalEstimado,
      fontesValidasCount: precosValidos.length,
      avisoIncongruencia,
    });
  }

  return parsedItems;
}
