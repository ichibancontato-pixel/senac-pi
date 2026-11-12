import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CadastrarAluno from './pages/CadastrarAluno'
import CadastrarDocente from './pages/CadastrarDocente'
import ConsultarFornecedor from './pages/ConsultarFornecedor'
import ConsultarPessoa from './pages/ConsultarPessoa'
import MenuPrincipal from './pages/MenuPrincipal'
import PerfilPessoa from './pages/PerfilPessoa'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPrincipal />} />
        <Route path="/alunos/cadastrar" element={<CadastrarAluno />} />
        <Route path="/docentes/cadastrar" element={<CadastrarDocente />} />
        <Route path="/fornecedores/consultar" element={<ConsultarFornecedor />} />
        <Route path="/pessoas/consultar" element={<ConsultarPessoa />} />
        <Route path="/pessoas/:id" element={<PerfilPessoa />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
