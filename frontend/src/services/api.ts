// Ponto único de acesso a dados.
// Sem VITE_API_URL -> modo demonstração (dados no navegador).
// Com VITE_API_URL  -> chama o back-end real nesse endereço.

import type { Api } from '../types'
import { criarApiHttp } from './http'
import { apiDemo } from './mock'

const urlBase = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export const modoDemonstracao = urlBase === ''

export const api: Api = modoDemonstracao ? apiDemo : criarApiHttp(urlBase)
