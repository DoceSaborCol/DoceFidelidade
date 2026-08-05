/**
 * Utilitários de Validação e Formatação de CPF (Brasil)
 * Doce Sabor Fidelidade
 */

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false

  // Bloquear CPFs com todos os dígitos iguais (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Validação do 1º Dígito Verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cleaned.charAt(9), 10)) return false

  // Validação do 2º Dígito Verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cleaned.charAt(10), 10)) return false

  return true
}
