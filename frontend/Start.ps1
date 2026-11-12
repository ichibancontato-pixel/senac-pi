<#
.SYNOPSIS
    Prepara e executa o front-end do Sistema de Gestao Academica.

.DESCRIPTION
    1. Verifica o Node.js (oferece instalar via winget).
    2. Instala as dependencias (npm install).
    3. Garante o arquivo .env (copia do .env.example).
    4. Valida o projeto (npm run build).
    5. Sobe o servidor de desenvolvimento em http://127.0.0.1:5173

.PARAMETER SetupOnly
    Apenas prepara o ambiente, sem subir o servidor.

.EXAMPLE
    .\Start.ps1
    .\Start.ps1 -SetupOnly
#>
param(
    [switch]$SetupOnly
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

# No Windows o npm e chamado pelo npm.cmd (evita bloqueio do npm.ps1 pela politica de execucao)
$naoWindows = ($null -ne $IsWindows) -and (-not $IsWindows)
$npm = if ($naoWindows) { 'npm' } else { 'npm.cmd' }

function Test-Comando([string]$Nome) {
    return [bool](Get-Command $Nome -ErrorAction SilentlyContinue)
}

function Invoke-Npm([string[]]$Argumentos, [string]$Falha) {
    & $npm @Argumentos
    if ($LASTEXITCODE -ne 0) { throw $Falha }
}

# ---------------------------------------------------------------- 1. Node.js
Write-Host '[1/4] Verificando Node.js...'
if (-not (Test-Comando 'node')) {
    $resposta = Read-Host 'Node.js nao encontrado. Deseja instalar a versao LTS via winget? (S/N)'
    if ($resposta -notmatch '^[sS]') {
        throw 'O Node.js e necessario. Instale a versao LTS em https://nodejs.org e rode o script de novo.'
    }
    if (-not (Test-Comando 'winget')) {
        throw 'winget nao esta disponivel. Instale o Node.js LTS em https://nodejs.org e rode o script de novo.'
    }
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    # Recarrega o PATH desta janela para encontrar o Node recem-instalado
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (Test-Comando 'node')) {
        throw 'Node.js instalado, mas ainda fora do PATH. Feche e abra o PowerShell e rode o script de novo.'
    }
}

$versao = (& node --version).Trim().TrimStart('v')
$partes = $versao.Split('.')
$maior = [int]$partes[0]
$menor = [int]$partes[1]
$suportada = ($maior -eq 20 -and $menor -ge 19) -or ($maior -eq 22 -and $menor -ge 12) -or ($maior -ge 23)
if (-not $suportada) {
    throw "Node.js $versao encontrado. Use a versao 20.19+ ou 22.12+ (recomendado: LTS mais recente)."
}
Write-Host "      Node.js $versao OK"

# ---------------------------------------------------------------- 2. Dependencias
Write-Host '[2/4] Instalando dependencias (npm install)...'
Invoke-Npm @('install', '--no-fund', '--no-audit') 'Falha no npm install.'

# ---------------------------------------------------------------- 3. .env
Write-Host '[3/4] Verificando arquivo .env...'
if (Test-Path '.env') {
    Write-Host '      .env ja existe, mantido.'
} else {
    Copy-Item '.env.example' '.env'
    Write-Host '      .env criado a partir do .env.example (modo demonstracao).'
}

# ---------------------------------------------------------------- 4. Validacao
Write-Host '[4/4] Validando o projeto (npm run build)...'
Invoke-Npm @('run', 'build') 'Falha na validacao: o projeto nao compilou.'
Write-Host '      Build OK'

if ($SetupOnly) {
    Write-Host ''
    Write-Host 'Ambiente pronto. Para iniciar o servidor: .\Start.ps1'
    exit 0
}

Write-Host ''
Write-Host 'Iniciando em http://127.0.0.1:5173  (Ctrl+C para parar)'
Invoke-Npm @('run', 'dev') 'O servidor foi encerrado com erro.'
