// Máscaras, conversões e validações usadas nos formulários.

export const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/** Aplica a máscara 000.000.000-00 enquanto o usuário digita. */
export function mascaraCpf(valor: string): string {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Formata um CNPJ de 14 dígitos como 00.000.000/0000-00. */
export function formatarCnpj(valor: string): string {
  const d = soDigitos(valor)
  if (d.length !== 14) return valor
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita. */
export function mascaraData(valor: string): string {
  const d = soDigitos(valor).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** Converte DD/MM/AAAA em AAAA-MM-DD. Retorna null se a data não existir. */
export function dataBrParaIso(valor: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor)
  if (!partes) return null
  const [, dd, mm, aaaa] = partes
  const dia = Number(dd)
  const mes = Number(mm)
  const ano = Number(aaaa)
  if (ano < 1900) return null
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const existe =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  return existe ? `${aaaa}-${mm}-${dd}` : null
}

/** Converte AAAA-MM-DD (ou um timestamp ISO) em DD/MM/AAAA. */
export function isoParaDataBr(valor: string | null | undefined): string {
  if (!valor) return '—'
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Data de hoje no fuso local, em AAAA-MM-DD. */
export function hojeIso(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/** Verifica o formato do CPF: 11 dígitos, sem repetir o mesmo dígito. */
export function cpfComFormatoValido(valor: string): boolean {
  const d = soDigitos(valor)
  return d.length === 11 && !/^(\d)\1{10}$/.test(d)
}

/** Texto em minúsculas e sem acentos, para buscas. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export const textoOuNulo = (valor: string) => (valor.trim() === '' ? null : valor.trim())
