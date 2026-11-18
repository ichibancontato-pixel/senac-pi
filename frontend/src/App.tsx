import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Protegida } from './components/Protegida'
import CadastrarAluno from './pages/CadastrarAluno'
import CadastrarDocente from './pages/CadastrarDocente'
import CadastrarFornecedor from './pages/CadastrarFornecedor'
import ConsultarFornecedor from './pages/ConsultarFornecedor'
import ConsultarPessoa from './pages/ConsultarPessoa'
import Entrar from './pages/Entrar'
import MenuPrincipal from './pages/MenuPrincipal'
import PerfilPessoa from './pages/PerfilPessoa'
import RelatorioMatriculas from './pages/RelatorioMatriculas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/" element={<Protegida><MenuPrincipal /></Protegida>} />
        <Route path="/alunos/cadastrar" element={<Protegida funcionalidade="alunos"><CadastrarAluno /></Protegida>} />
        <Route path="/docentes/cadastrar" element={<Protegida funcionalidade="docentes"><CadastrarDocente /></Protegida>} />
        <Route path="/fornecedores/consultar" element={<Protegida funcionalidade="fornecedores"><ConsultarFornecedor /></Protegida>} />
        <Route path="/fornecedores/cadastrar" element={<Protegida funcionalidade="fornecedores"><CadastrarFornecedor /></Protegida>} />
        <Route path="/pessoas/consultar" element={<Protegida funcionalidade="pessoas"><ConsultarPessoa /></Protegida>} />
        <Route path="/pessoas/:id" element={<Protegida funcionalidade="pessoas"><PerfilPessoa /></Protegida>} />
        <Route path="/relatorios/matriculas" element={<Protegida funcionalidade="relatorios"><RelatorioMatriculas /></Protegida>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
