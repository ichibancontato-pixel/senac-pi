// Caso de Uso 4, passo 8: tela com todos os detalhes do registro.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Mensagem } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { Secao } from '../components/Secao'
import { api } from '../services/api'
import { ehApiError, MENSAGENS } from '../services/erros'
import type { PessoaDetalhe } from '../types'
import { isoParaDataBr, mascaraCpf } from '../utils/formatos'

const ouTraco = (valor: string | null | undefined) => (valor ? valor : '—')

export default function PerfilPessoa() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [pessoa, setPessoa] = useState<PessoaDetalhe | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const numero = Number(id)
  const idValido = Number.isInteger(numero) && numero > 0
  const erro = idValido ? erroCarga : 'Pessoa não encontrada.'

  useEffect(() => {
    if (!idValido) return
    let ativo = true
    api
      .obterPessoa(numero)
      .then((dados) => {
        if (ativo) setPessoa(dados)
      })
      .catch((falha: unknown) => {
        if (!ativo) return
        if (ehApiError(falha) && falha.codigo === 'NAO_ENCONTRADO') setErroCarga('Pessoa não encontrada.')
        else setErroCarga(MENSAGENS.conexaoConsulta)
      })
    return () => {
      ativo = false
    }
  }, [idValido, numero])

  return (
    <Pagina titulo={pessoa ? pessoa.nome : 'Perfil'}>
      <Cabecalho caminho={['Gestão de Pessoas', 'Consultar Pessoa', 'Perfil']} />

      <div className="barra-voltar">
        <Botao onClick={() => navigate('/pessoas/consultar')}>← VOLTAR À CONSULTA</Botao>
      </div>

      {erro ? <Mensagem tipo="erro">{erro}</Mensagem> : null}
      {!pessoa && !erro ? <p className="carregando">Carregando...</p> : null}

      {pessoa ? (
        <div className="perfil secao-separada">
          <Secao titulo="DADOS PESSOAIS">
            <dl className="resumo">
              <dt>Nome completo:</dt>
              <dd>{pessoa.nome}</dd>
              <dt>CPF:</dt>
              <dd>{mascaraCpf(pessoa.cpf)}</dd>
              <dt>Data de nascimento:</dt>
              <dd>{isoParaDataBr(pessoa.data_nascimento)}</dd>
              <dt>E-mail:</dt>
              <dd>{ouTraco(pessoa.email)}</dd>
              <dt>Telefone:</dt>
              <dd>{ouTraco(pessoa.telefone)}</dd>
              <dt>Vínculo:</dt>
              <dd>{ouTraco(pessoa.vinculo)}</dd>
              <dt>Situação do cadastro:</dt>
              <dd>{pessoa.ativo ? 'Ativo' : 'Inativo'}</dd>
            </dl>
          </Secao>

          {pessoa.aluno ? (
            <Secao titulo="DADOS ACADÊMICOS">
              <dl className="resumo">
                <dt>Matrícula:</dt>
                <dd className="destaque">{pessoa.aluno.matricula}</dd>
                <dt>Curso:</dt>
                <dd>{pessoa.aluno.nome_curso}</dd>
                <dt>Turno:</dt>
                <dd>{pessoa.aluno.turno}</dd>
                <dt>Situação:</dt>
                <dd>{pessoa.aluno.situacao}</dd>
                <dt>Data da matrícula:</dt>
                <dd>{isoParaDataBr(pessoa.aluno.data_matricula)}</dd>
              </dl>
            </Secao>
          ) : null}

          {pessoa.docente ? (
            <>
              <Secao titulo="DADOS INSTITUCIONAIS">
                <dl className="resumo">
                  <dt>Titulação:</dt>
                  <dd>{pessoa.docente.titulacao}</dd>
                  <dt>Departamento:</dt>
                  <dd>{pessoa.docente.nome_depto}</dd>
                  <dt>Carga horária semanal:</dt>
                  <dd>{pessoa.docente.carga_horaria} horas</dd>
                </dl>
              </Secao>
              <Secao titulo="DADOS BANCÁRIOS">
                <dl className="resumo">
                  <dt>Banco:</dt>
                  <dd>{ouTraco(pessoa.docente.banco)}</dd>
                  <dt>Agência:</dt>
                  <dd>{ouTraco(pessoa.docente.agencia)}</dd>
                  <dt>Conta corrente:</dt>
                  <dd>{ouTraco(pessoa.docente.conta_corrente)}</dd>
                </dl>
              </Secao>
            </>
          ) : null}

          {pessoa.administrador ? (
            <Secao titulo="ACESSO AO SISTEMA">
              <dl className="resumo">
                <dt>Login:</dt>
                <dd>{pessoa.administrador.login}</dd>
              </dl>
            </Secao>
          ) : null}
        </div>
      ) : null}

      <div className="rodape-verde" />
    </Pagina>
  )
}
