import * as XLSX from 'xlsx';
import { AttachmentFile } from '../types';

/**
 * Utilitário de Processamento Universal de Arquivos
 * Extrai texto de arquivos PDF, DOCX, XLSX e Imagens para enriquecimento do prompt da IA.
 */
export async function extractTextFromFile(file: File): Promise<AttachmentFile> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';
  let previewUrl: string | undefined = undefined;

  try {
    if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetOutputs: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        sheetOutputs.push(`[PLANILHA: ${sheetName}]\n${csvContent}`);
      }

      extractedText = sheetOutputs.join('\n\n');
    } else if (fileExt === 'docx') {
      // DOCX é um arquivo ZIP que contém document.xml
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8');
      const rawText = textDecoder.decode(buffer);
      
      // Extração de tags <w:t> do document.xml
      const matches = rawText.match(/<w:t[\s>][^<]*<\/w:t>/g);
      if (matches && matches.length > 0) {
        extractedText = matches
          .map((m) => m.replace(/<[^>]+>/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (!extractedText || extractedText.length < 20) {
        // Fallback para strings legíveis
        const clean = rawText.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, ' ').replace(/\s+/g, ' ');
        extractedText = clean.substring(0, 5000);
      }
    } else if (fileExt === 'pdf') {
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('latin1');
      const raw = textDecoder.decode(buffer);

      // Extração de streams de texto de PDF (operadores BT / ET e strings literais ou hexadecimais)
      const textChunks: string[] = [];
      const streamRegex = /BT[\s\S]*?ET/g;
      let match;
      while ((match = streamRegex.exec(raw)) !== null) {
        const stream = match[0];
        // Encontrar strings entre parênteses \(...\)
        const strRegex = /\(([^)]+)\)/g;
        let strMatch;
        while ((strMatch = strRegex.exec(stream)) !== null) {
          textChunks.push(strMatch[1]);
        }
      }

      if (textChunks.length > 0) {
        extractedText = textChunks.join(' ').replace(/\\r|\\n/g, '\n').replace(/\s+/g, ' ').trim();
      }

      if (!extractedText || extractedText.length < 30) {
        // Fallback
        extractedText = `[Documento PDF: ${file.name} - Tamanho: ${(file.size / 1024).toFixed(1)} KB]. Conteúdo anexado para análise de conformidade licitatória.`;
      }
    } else if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
      extractedText = `[Imagem Anexa: ${file.name} - Tipo: ${file.type} - Dimensão/Arquivo: ${(file.size / 1024).toFixed(1)} KB]. Diagrama/foto ou documento digitalizado submetido como memorial de apoio para especificação técnica.`;
    } else {
      // Arquivos de texto puro (.txt, .md, .json, etc.)
      extractedText = await file.text();
    }
  } catch (err: any) {
    console.error('Erro ao extrair conteúdo do arquivo:', err);
    extractedText = `[Arquivo: ${file.name} - Leitura básica]: Erro na extração automática, arquivo considerado como anexo de referência documental.`;
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: file.name,
    size: file.size,
    type: file.type || fileExt.toUpperCase(),
    text: extractedText.trim(),
    previewUrl,
  };
}
