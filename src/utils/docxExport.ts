import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

/**
 * Converte o texto Markdown gerado pelo LicitIA em um documento Word (.docx)
 * estilizado e estruturado conforme o padrão de documentos oficiais da Administração Pública.
 */
export async function generateAndDownloadDocx(
  title: string,
  content: string,
  moduleName: string,
  userProfile?: any
) {
  const lines = content.split('\n');
  const paragraphs: (Paragraph | Table)[] = [];

  // Cabeçalho Oficial
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (userProfile?.razao_social || userProfile?.orgao_publico || 'ADMINISTRAÇÃO PÚBLICA').toUpperCase(),
          bold: true,
          size: 24, // 12pt
          font: 'Arial',
          color: '0F172A',
        }),
      ],
    })
  );

  if (userProfile?.cnpj) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `CNPJ nº ${userProfile.cnpj} - ${userProfile.cidade || ''}/${userProfile.uf || ''}`,
            size: 18, // 9pt
            font: 'Arial',
            color: '475569',
          }),
        ],
      })
    );
  }

  // Título da Peça
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { before: 200, after: 300 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 12,
          color: '2563EB',
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 28, // 14pt
          font: 'Arial',
          color: '1E3A8A',
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Documento elaborado sob a égide da Lei Federal nº 14.133/2021 via LicitIA - Smart Procure`,
          italics: true,
          size: 18,
          font: 'Arial',
          color: '64748B',
        }),
      ],
    })
  );

  // Processamento linha por linha do Markdown
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [],
        })
      );
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({
              text: trimmed.replace(/^#\s+/, ''),
              bold: true,
              size: 24,
              font: 'Arial',
              color: '0F172A',
            }),
          ],
        })
      );
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: trimmed.replace(/^##\s+/, ''),
              bold: true,
              size: 22,
              font: 'Arial',
              color: '1E3A8A',
            }),
          ],
        })
      );
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: trimmed.replace(/^###\s+/, ''),
              bold: true,
              size: 20,
              font: 'Arial',
              color: '334155',
            }),
          ],
        })
      );
      continue;
    }

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletText = trimmed.replace(/^[-*]\s+/, '');
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
          children: parseFormattedRuns(bulletText),
        })
      );
      continue;
    }

    // Standard paragraph with justify alignment & indentation standard for Brazilian legal texts
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140, line: 276 }, // 1.15 line spacing
        indent: { firstLine: 720 }, // 1.25 cm standard paragraph indentation
        children: parseFormattedRuns(trimmed),
      })
    );
  }

  // Bloco de Assinatura Final
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 120 },
      children: [
        new TextRun({
          text: '___________________________________________________________',
          color: '94A3B8',
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: userProfile?.representante_legal || 'Autoridade Competente / Representante Legal',
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: userProfile?.cargo_representante || (userProfile?.role === 'admin' ? 'Agente de Contratação / Pregoeiro' : 'Representante Legal'),
          italics: true,
          size: 18,
          color: '475569',
          font: 'Arial',
        }),
      ],
    })
  );

  // Criar o Documento DOCX
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.5 cm
              right: 1440,
              bottom: 1440,
              left: 1700, // 3.0 cm margem esquerda formal
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `LicitIA - Smart Procure | ${moduleName}`,
                    size: 16,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Página ',
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  // Gerar Blob e acionar download no navegador
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  a.href = url;
  a.download = `${safeTitle || 'Documento_Licitacao'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Auxiliar para converter markdown simples (**negrito**, *itálico*) em TextRuns do docx
 */
function parseFormattedRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Tokenize regex for **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: 'Arial',
          size: 22, // 11pt
          color: '0F172A',
        })
      );
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          italics: true,
          font: 'Arial',
          size: 22,
          color: '1E293B',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: 'Arial',
          size: 22,
          color: '1E293B',
        })
      );
    }
  }

  return runs;
}
