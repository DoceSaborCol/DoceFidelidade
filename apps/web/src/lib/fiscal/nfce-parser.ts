/**
  * Parser e Validador de NFC-e (Modelo 65) — SEFAZ Espírito Santo (UF 32)
  * Doce Sabor Fidelidade
  */

export interface ParsedNFCeKey {
  rawKey: string
  ufCode: string // 32 = ES
  yearMonth: string // YYMM
  cnpj: string // 14 dígitos
  model: string // 65 = NFC-e
  series: string // 3 dígitos
  number: string // 9 dígitos
  emissionType: string // 1 = Normal, 9 = Contingência
  randomCode: string // 8 dígitos
  checkDigit: string // 1 dígito
  isValid: boolean
  isES: boolean
  isModel65: boolean
  isDoceSaborColatina: boolean
  errorMessage?: string
}

export interface ParsedNFCeUrl {
  accessKey: string
  version?: string
  environment?: '1' | '2' // 1 = Produção, 2 = Homologação
  cpfDest?: string
  dateEmission?: string
  totalValueCents?: number
  digestValue?: string
  parsedKey: ParsedNFCeKey
}

const DOCE_SABOR_COLATINA_CNPJ = '02982922000177'

/**
  * Valida o dígito verificador da chave de acesso de 44 dígitos (Módulo 11)
  */
export function validateCheckDigit(key43: string): number {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9]
  let sum = 0
  let weightIndex = 0

  for (let i = key43.length - 1; i >= 0; i--) {
    sum += parseInt(key43[i], 10) * weights[weightIndex]
    weightIndex = (weightIndex + 1) % weights.length
  }

  const remainder = sum % 11
  const dv = 11 - remainder
  return dv >= 10 ? 0 : dv
}

/**
  * Analisa e valida os 44 dígitos de uma Chave de Acesso de NFC-e
  */
export function parseNFCeKey(key: string): ParsedNFCeKey {
  const cleaned = key.replace(/\D/g, '')

  if (cleaned.length !== 44) {
    return {
      rawKey: cleaned,
      ufCode: '',
      yearMonth: '',
      cnpj: '',
      model: '',
      series: '',
      number: '',
      emissionType: '',
      randomCode: '',
      checkDigit: '',
      isValid: false,
      isES: false,
      isModel65: false,
      isDoceSaborColatina: false,
      errorMessage: `A chave deve conter exatamente 44 dígitos (encontrados: ${cleaned.length}).`,
    }
  }

  const ufCode = cleaned.substring(0, 2)
  const yearMonth = cleaned.substring(2, 6)
  const cnpj = cleaned.substring(6, 20)
  const model = cleaned.substring(20, 22)
  const series = cleaned.substring(22, 25)
  const number = cleaned.substring(25, 34)
  const emissionType = cleaned.substring(34, 35)
  const randomCode = cleaned.substring(35, 43)
  const checkDigit = cleaned.substring(43, 44)

  const expectedDv = validateCheckDigit(cleaned.substring(0, 43))
  const isDvValid = parseInt(checkDigit, 10) === expectedDv
  const isES = ufCode === '32'
  const isModel65 = model === '65'
  const isDoceSaborColatina = cnpj === DOCE_SABOR_COLATINA_CNPJ

  let errorMessage: string | undefined

  if (!isModel65) {
    errorMessage = 'Esta chave não pertence a uma NFC-e (Modelo 65).'
  } else if (!isDvValid) {
    errorMessage = 'O dígito verificador da chave fiscal é inválido.'
  } else if (!isDoceSaborColatina) {
    errorMessage = 'Esta nota fiscal não pertence à loja Doce Sabor Colatina.'
  }

  return {
    rawKey: cleaned,
    ufCode,
    yearMonth,
    cnpj,
    model,
    series,
    number,
    emissionType,
    randomCode,
    checkDigit,
    isValid: isModel65 && isDvValid && isDoceSaborColatina,
    isES,
    isModel65,
    isDoceSaborColatina,
    errorMessage,
  }
}

/**
  * Extrai a chave de acesso a partir de uma URL de QR Code da SEFAZ-ES ou texto colado
  */
export function parseNFCeQrUrl(input: string): ParsedNFCeUrl {
  const trimmed = input.trim()

  // Se o input for diretamente a chave de 44 dígitos
  if (/^\d{44}$/.test(trimmed.replace(/\D/g, ''))) {
    const key = trimmed.replace(/\D/g, '')
    return {
      accessKey: key,
      parsedKey: parseNFCeKey(key),
    }
  }

  // Tentar extrair parâmetro p= ou chNFe= de URLs da SEFAZ
  try {
    const url = new URL(trimmed)
    let accessKey = ''

    // Padrão SEFAZ ES: .../consulta?p=32260802982922000177650010000184211000041300|2|1|1|...
    const pParam = url.searchParams.get('p')
    const chNFeParam = url.searchParams.get('chNFe')

    if (pParam) {
      const parts = pParam.split('|')
      accessKey = parts[0].replace(/\D/g, '')
    } else if (chNFeParam) {
      accessKey = chNFeParam.replace(/\D/g, '')
    } else {
      // Regex de busca por 44 dígitos sequenciais na URL
      const match = trimmed.match(/\d{44}/)
      if (match) {
        accessKey = match[0]
      }
    }

    const parsedKey = parseNFCeKey(accessKey)

    return {
      accessKey,
      version: url.searchParams.get('nVersao') || undefined,
      environment: (url.searchParams.get('tpAmb') as '1' | '2') || undefined,
      parsedKey,
    }
  } catch {
    // Se não for uma URL válida, busca qualquer sequência de 44 dígitos
    const match = trimmed.match(/\d{44}/)
    const accessKey = match ? match[0] : trimmed.replace(/\D/g, '')
    return {
      accessKey,
      parsedKey: parseNFCeKey(accessKey),
    }
  }
}
