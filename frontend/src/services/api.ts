// Ponto único de acesso a dados.
// Padrão: backend real (pasta backend/), acessado por /api através do proxy do Vite.
// Com VITE_MODO_DEMO=true: dados de demonstração dentro do navegador, sem servidor.

import type { Api } from '../types'
import { apiHttp } from './http'
import { apiDemo } from './mock'

export const modoDemonstracao = import.meta.env.VITE_MODO_DEMO === 'true'

export const api: Api = modoDemonstracao ? apiDemo : apiHttp
