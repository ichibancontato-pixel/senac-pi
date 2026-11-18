// Máscaras, formatação e validações usadas nas telas.

export const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/** Máscara 000.000.000-00 enquanto o usuário digita. */
export function mascaraCpf(valor: string): string {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Máscara 00.000.000/0000-00 enquanto o usuário digita. */
export function mascaraCnpj(valor: string): string {
  const d = soDigitos(valor).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** CPF até 11 dígitos, CNPJ a partir do 12º. */
export function mascaraDocumento(valor: string): string {
  return soDigitos(valor).length <= 11 ? mascaraCpf(valor) : mascaraCnpj(valor)
}

/** Exibe um documento salvo (11 dígitos = CPF, 14 = CNPJ). */
export function formatarDocumento(valor: string): string {
  const d = soDigitos(valor)
  if (d.length === 11) return mascaraCpf(d)
  if (d.length === 14) return mascaraCnpj(d)
  return valor
}

/** Máscara (11) 99999-9999 ou (11) 3333-4444 enquanto o usuário digita. */
export function mascaraTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatarTelefone(valor: string | null): string {
  if (!valor) return '—'
  const d = soDigitos(valor)
  return d.length === 10 || d.length === 11 ? mascaraTelefone(d) : valor
}

/**
 * Data e hora no fuso local. Aceita ISO ("2026-11-18T12:52:34Z") e o formato do
 * SQLite ("2026-11-18 12:52:34", gravado em UTC).
 */
export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const iso = valor.includes('T') ? valor : `${valor.replace(' ', 'T')}Z`
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return valor
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** "ATIVO" -> "Ativo" */
export function capitalizar(texto: string): string {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : texto
}

/** CPF com 11 dígitos, sem repetir o mesmo dígito. */
export function cpfComFormatoValido(valor: string): boolean {
  const d = soDigitos(valor)
  return d.length === 11 && !/^(\d)\1{10}$/.test(d)
}

export function cnpjComFormatoValido(valor: string): boolean {
  const d = soDigitos(valor)
  return d.length === 14 && !/^(\d)\1{13}$/.test(d)
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

export function telefoneValido(valor: string): boolean {
  const d = soDigitos(valor)
  return d.length === 10 || d.length === 11
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

export const digitosOuNulo = (valor: string) => {
  const d = soDigitos(valor)
  return d === '' ? null : d
}
