import type { Aluno, Docente, FiltroPessoa, Fornecedor, Pessoa, PessoaResumo, Vinculo } from '../types'
import { normalizar, soDigitos } from './formatos'

/**
 * Junta a tabela de pessoas com alunos, docentes e fornecedores para descobrir o vínculo
 * de cada registro, e aplica os filtros da tela Consultar Pessoa.
 */
export function combinarPessoas(
  pessoas: Pessoa[],
  alunos: Aluno[],
  docentes: Docente[],
  fornecedores: Fornecedor[],
  filtro: FiltroPessoa,
): PessoaResumo[] {
  const alunoPorPessoa = new Map(alunos.map((a) => [a.pessoa_id, a]))
  const idsDocentes = new Set(docentes.map((d) => d.pessoa_id))
  const idsFornecedores = new Set(fornecedores.map((f) => f.pessoa_id))

  const documento = soDigitos(filtro.documento ?? '')
  const matricula = soDigitos(filtro.matricula ?? '')
  const nome = normalizar(filtro.nome ?? '')

  return pessoas
    .map((pessoa): PessoaResumo => {
      const aluno = alunoPorPessoa.get(pessoa.id)
      let vinculo: Vinculo = pessoa.tipo_pessoa === 'JURIDICA' ? 'Pessoa jurídica' : 'Pessoa física'
      if (aluno) vinculo = 'Aluno'
      else if (idsDocentes.has(pessoa.id)) vinculo = 'Docente'
      else if (idsFornecedores.has(pessoa.id)) vinculo = 'Fornecedor'
      return { ...pessoa, vinculo, matricula: aluno?.matricula ?? null }
    })
    .filter((p) => {
      if (filtro.tipoPessoa && p.tipo_pessoa !== filtro.tipoPessoa) return false
      if (documento && !p.documento.includes(documento)) return false
      if (matricula && !(p.matricula ?? '').includes(matricula)) return false
      if (nome && !normalizar(p.nome).includes(nome)) return false
      return true
    })
}
