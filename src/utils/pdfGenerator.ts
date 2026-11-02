import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../types';

/**
 * Utilitário profissional para conversão e exportação de relatórios estruturados
 * do LicitAI (especialmente o Parecer Técnico de Pesquisa de Mercado com Quadro do PNCP
 * e Memória de Cálculo Estatístico, bem como todos os outros módulos de contratação pública)
 * em PDF oficial de alta fidelidade visual, em conformidade com a Lei nº 14.133/2021 e IN SEGES/ME nº 65/2021.
 */
export async function generateAndDownloadPdf(
  title: string,
  content: string,
  moduleName: string,
  userProfile?: User
): Promise<void> {
  // Inicialização do documento em tamanho A4 retrato
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 18;
  const marginRight = 18;
  const marginTop = 22;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = marginTop;

  // Função auxiliar para quebra de página
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop + 4;
      return true;
    }
    return false;
  };

  // =========================================================================
  // 1. CABEÇALHO OFICIAL DA ADMINISTRAÇÃO PÚBLICA / LICITAI
  // =========================================================================

  // Faixa superior decorativa em azul marinho
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginLeft, currentY, contentWidth, 2, 'F');
  currentY += 6;

  // República Federativa do Brasil
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('REPÚBLICA FEDERATIVA DO BRASIL', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Razão Social / Órgão Público
  const orgaoNome = (
    userProfile?.razao_social ||
    userProfile?.orgao_publico ||
    'ADMINISTRAÇÃO PÚBLICA CONTRATANTE'
  ).toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(orgaoNome, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Detalhes cadastrais (CNPJ e Localização)
  if (userProfile?.cnpj || userProfile?.cidade) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const cnpjLine = [
      userProfile?.cnpj ? `CNPJ nº ${userProfile.cnpj}` : '',
      userProfile?.cidade ? `${userProfile.cidade}/${userProfile?.uf || ''}` : '',
      userProfile?.logradouro ? `${userProfile.logradouro}, ${userProfile?.numero || 's/n'}` : '',
    ]
      .filter(Boolean)
      .join(' • ');
    doc.text(cnpjLine, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
  }

  // Linha separadora institucional
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 5;

  // Título da Peça Licitatória
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // blue-900
  const titleLines = doc.splitTextToSize(title.toUpperCase(), contentWidth);
  doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
  currentY += titleLines.length * 5 + 1;

  // Subtítulo e fundamentação legal de cabeçalho
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'Documento oficial emitido sob a égide da Lei Federal nº 14.133/2021 e da Instrução Normativa SEGES/ME nº 65/2021',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 4;

  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Emissão: ${emissionDate} • Sistema Especialista LicitAI - Smart Procure`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 6;

  // Divisória do corpo
  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.6);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
  currentY += 6;

  // =========================================================================
  // 2. PARSER DE CONTEÚDO ESTRUTURADO (MARKDOWN, TABELAS DO PNCP, ESTATÍSTICA)
  // =========================================================================

  const rawLines = content.split('\n');
  let i = 0;

  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    // 1. Linha vazia
    if (!trimmed) {
      currentY += 2;
      i++;
      continue;
    }

    // 2. Tabela Markdown (Quadro de Coleta do PNCP, etc.)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        const line = rawLines[i].trim();
        // Ignora linhas separadoras de alinhamento (|:---|:---:|)
        if (!/^\|[\s\-:|]+\|$/.test(line)) {
          tableLines.push(line);
        }
        i++;
      }

      if (tableLines.length >= 2) {
        // Primeira linha é o cabeçalho
        const headRow = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => cleanMarkdownFormatting(c.trim()));

        // As demais são o corpo da tabela
        const bodyRows = tableLines.slice(1).map((rowStr) =>
          rowStr
            .slice(1, -1)
            .split('|')
            .map((c) => cleanMarkdownFormatting(c.trim()))
        );

        checkPageBreak(30);

        // Renderiza com autoTable com layout formal de licitação
        autoTable(doc, {
          startY: currentY,
          margin: { left: marginLeft, right: marginRight },
          head: [headRow],
          body: bodyRows,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 6.5,
            cellPadding: 1.5,
            textColor: [30, 41, 59],
            lineColor: [203, 213, 225],
            lineWidth: 0.15,
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: [30, 58, 138], // blue-900
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252], // slate-50
          },
          didParseCell: (data) => {
            // Destaque visual inteligente para a coluna "Situação da Amostra"
            const text = String(data.cell.raw || '');
            if (text.includes('Expurgado')) {
              data.cell.styles.textColor = [190, 18, 60]; // rose-700
              data.cell.styles.fontStyle = 'bold';
            } else if (text.includes('Mantido')) {
              data.cell.styles.textColor = [4, 120, 87]; // emerald-700
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
        continue;
      }
    }

    // 3. Título Principal (# Título)
    if (trimmed.startsWith('# ')) {
      const headingText = cleanMarkdownFormatting(trimmed.replace(/^#\s+/, ''));
      checkPageBreak(16);
      currentY += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      const splitHeading = doc.splitTextToSize(headingText, contentWidth);
      doc.text(splitHeading, marginLeft, currentY);
      currentY += splitHeading.length * 5 + 2;

      // Barra de destaque sob cabeçalho de seção
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(marginLeft, currentY - 1, marginLeft + contentWidth, currentY - 1);
      currentY += 2;
      i++;
      continue;
    }

    // 4. Seção Secundária (## Seção)
    if (trimmed.startsWith('## ')) {
      const headingText = cleanMarkdownFormatting(trimmed.replace(/^##\s+/, ''));
      checkPageBreak(14);
      currentY += 4;

      // Destaque para seções específicas de pesquisa de preços
      const isMetricas = headingText.includes('AMBIENTE ESTATÍSTICO') || headingText.includes('MEMÓRIA DE CÁLCULO');
      const isSobrepreco = headingText.includes('SOBREPREÇO');
      const isRecomendacao = headingText.includes('RECOMENDAÇÃO') || headingText.includes('VALOR REFERENCIAL');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 58, 138); // blue-900
      const splitHeading = doc.splitTextToSize(headingText, contentWidth);
      doc.text(splitHeading, marginLeft, currentY);
      currentY += splitHeading.length * 4.5 + 2;

      i++;
      continue;
    }

    // 5. Subseção (### Subseção)
    if (trimmed.startsWith('### ')) {
      const headingText = cleanMarkdownFormatting(trimmed.replace(/^###\s+/, ''));
      checkPageBreak(10);
      currentY += 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // slate-700
      const splitSub = doc.splitTextToSize(headingText, contentWidth);
      doc.text(splitSub, marginLeft, currentY);
      currentY += splitSub.length * 4 + 1.5;

      i++;
      continue;
    }

    // 6. Alertas / Diagnóstico de Sobrepreço em Destaque
    if (
      trimmed.includes('NÃO APRESENTA INDÍCIOS DE SOBREPREÇO') ||
      trimmed.includes('APRESENTA INDÍCIOS DE SOBREPREÇO') ||
      trimmed.includes('INDÍCIO DE DISPERSÃO')
    ) {
      checkPageBreak(18);
      const isAprovado = trimmed.includes('NÃO APRESENTA INDÍCIOS DE SOBREPREÇO');

      // Caixa de destaque colorido
      if (isAprovado) {
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.setDrawColor(16, 185, 129); // emerald-500
        doc.setTextColor(6, 95, 70); // emerald-800
      } else {
        doc.setFillColor(254, 243, 199); // amber-50
        doc.setDrawColor(245, 158, 11); // amber-500
        doc.setTextColor(146, 64, 14); // amber-800
      }

      doc.roundedRect(marginLeft, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        isAprovado
          ? '✔ DIAGNÓSTICO DO LICITAI: NÃO APRESENTA INDÍCIOS DE SOBREPREÇO'
          : '⚠ ALERTA DO LICITAI: AMOSTRA COM ALTA DISPERSÃO (MEDIANA MANDATÓRIA)',
        marginLeft + 4,
        currentY + 7.5
      );

      currentY += 15;
      i++;
      continue;
    }

    // 7. Bullet Lists (- ou *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      checkPageBreak(8);
      const bulletContent = cleanMarkdownFormatting(trimmed.replace(/^[-*]\s+/, ''));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235); // marcador azul
      doc.text('•', marginLeft + 2, currentY);

      // Renderiza o texto com suporte a partes em negrito
      renderFormattedParagraph(doc, bulletContent, marginLeft + 6, currentY, contentWidth - 8, 3.8);

      const splitText = doc.splitTextToSize(bulletContent, contentWidth - 8);
      currentY += splitText.length * 3.8 + 1.5;

      i++;
      continue;
    }

    // 8. Parágrafo Regular com Recuo e Justificação
    checkPageBreak(8);
    const cleanText = cleanMarkdownFormatting(trimmed);
    const splitText = doc.splitTextToSize(cleanText, contentWidth - 4);

    renderFormattedParagraph(doc, cleanText, marginLeft + 2, currentY, contentWidth - 4, 3.8);
    currentY += splitText.length * 3.8 + 2;

    i++;
  }

  // =========================================================================
  // 3. BLOCO DE FECHAMENTO E ASSINATURA FORMAL
  // =========================================================================
  checkPageBreak(42);
  currentY += 8;

  const localData = `${userProfile?.cidade || 'Brasília'} - ${userProfile?.uf || 'DF'}, ${emissionDate}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(localData, pageWidth / 2, currentY, { align: 'center' });
  currentY += 14;

  // Linha para assinatura
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 45, currentY, pageWidth / 2 + 45, currentY);
  currentY += 4.5;

  // Nome do signatário
  const signatarioNome =
    userProfile?.representante_legal || 'Autoridade Competente / Responsável Técnico';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(signatarioNome, pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.8;

  // Cargo / Função
  const signatarioCargo =
    userProfile?.cargo_representante ||
    (userProfile?.role === 'admin'
      ? 'Agente de Contratação / Pregoeiro Oficial - Equipe de Pesquisa de Preços'
      : 'Representante Legal da Empresa');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(signatarioCargo, pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  // Razão Social / Órgão
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(orgaoNome, pageWidth / 2, currentY, { align: 'center' });

  if (userProfile?.cnpj) {
    currentY += 3.2;
    doc.text(`CNPJ nº ${userProfile.cnpj}`, pageWidth / 2, currentY, { align: 'center' });
  }

  // =========================================================================
  // 4. CABEÇALHO E RODAPÉ PADRÃO EM TODAS AS PÁGINAS (PÁGINA X DE Y)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Cabeçalho de continuação a partir da página 2
    if (p > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`LicitAI - Smart Procure | ${title.substring(0, 48)}`, marginLeft, 12);
      doc.text(
        `Lei nº 14.133/2021 c/c IN SEGES 65/2021`,
        pageWidth - marginRight,
        12,
        { align: 'right' }
      );

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, 14, pageWidth - marginRight, 14);
    }

    // Rodapé em todas as páginas
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, footerY - 3, pageWidth - marginRight, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Documento com validade administrativa gerado via LicitAI - Plataforma Especialista em Contratações Públicas',
      marginLeft,
      footerY
    );

    // Numeração oficial
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginRight, footerY, {
      align: 'right',
    });
  }

  // =========================================================================
  // 5. DOWNLOAD NO NAVEGADOR DO USUÁRIO
  // =========================================================================
  const safeFilename = title
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .substring(0, 50);

  doc.save(`${safeFilename || 'relatorio_licitacao'}.pdf`);
}

/**
 * Limpa links Markdown `[texto](url)` e caracteres de escape desnecessários
 */
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // extrai o texto do link markdown
    .replace(/^>\s*/g, '') // remove citação de bloco
    .replace(/`/g, '') // remove backticks
    .trim();
}

/**
 * Renderiza um parágrafo quebrando em múltiplas linhas e aplicando formatação
 * básica de negrito quando marcado com **texto**
 */
function renderFormattedParagraph(
  doc: jsPDF,
  rawText: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  // Para simplicidade e estabilidade tipográfica perfeita no jsPDF,
  // se contiver **palavra**, destacamos; caso contrário desenhamos o bloco de texto
  const cleanPlain = rawText.replace(/\*\*(.*?)\*\*/g, '$1');
  const lines = doc.splitTextToSize(cleanPlain, maxWidth);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800

  // Se a linha inteira for um item de chave-valor (ex: "- Média Simples: R$ 100,00"),
  // destacamos a chave em negrito
  lines.forEach((line: string, index: number) => {
    const lineY = y + index * lineHeight;
    if (index === 0 && line.includes(':')) {
      const parts = line.split(':');
      doc.setFont('helvetica', 'bold');
      doc.text(parts[0] + ':', x, lineY);
      const labelWidth = doc.getTextWidth(parts[0] + ': ');
      doc.setFont('helvetica', 'normal');
      doc.text(parts.slice(1).join(':'), x + labelWidth, lineY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.text(line, x, lineY);
    }
  });
}
