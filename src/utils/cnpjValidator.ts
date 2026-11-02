/**
 * Algoritmo estrito de validação de CNPJ brasileiro (14 dígitos).
 * Realiza verificação de formato, impede sequências repetidas e
 * calcula os dois dígitos verificadores (módulo 11 com pesos).
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // CNPJ deve ter exatamente 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos com todos os números iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  let tamanho = cleanCNPJ.length - 2;
  let numeros = cleanCNPJ.substring(0, tamanho);
  const digitos = cleanCNPJ.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  // Validação do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cleanCNPJ.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
}

/**
 * Formata CNPJ na máscara padrão: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata CEP na máscara padrão: XXXXX-XXX
 */
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata Telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
