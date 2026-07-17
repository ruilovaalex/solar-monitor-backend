Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Import-BackendEnvironment {
  $envPath = Join-Path $PSScriptRoot "..\.env"
  if (-not (Test-Path -LiteralPath $envPath)) {
    throw "No se encontro el archivo .env del backend: $envPath"
  }

  foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^\s*([^#][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $name = $matches[1]
      $value = $matches[2].Trim().Trim('"').Trim("'")
      if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }
}

function Get-DatabaseUrl {
  Import-BackendEnvironment
  $databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL no esta configurada."
  }
  return $databaseUrl
}

function Get-PostgresConnectionUrl {
  param([Parameter(Mandatory = $true)][string]$DatabaseUrl)

  $connectionUrl = $DatabaseUrl -replace '([?&])schema=[^&]*', ''
  $connectionUrl = $connectionUrl -replace '\?&', '?'
  $connectionUrl = $connectionUrl -replace '[?&]$', ''
  return $connectionUrl
}

function Find-PostgresTool {
  param([Parameter(Mandatory = $true)][string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $installRoot = "C:\Program Files\PostgreSQL"
  $candidate = Get-ChildItem -LiteralPath $installRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { [version]$_.Name } -Descending |
    ForEach-Object { Join-Path $_.FullName "bin\$Name.exe" } |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

  if (-not $candidate) {
    throw "No se encontro $Name. Instala las herramientas de PostgreSQL o agrega su carpeta bin al PATH."
  }
  return $candidate
}

function Get-DatabaseLabel {
  param([Parameter(Mandatory = $true)][string]$DatabaseUrl)

  try {
    $uri = [Uri]$DatabaseUrl
    return "$($uri.Host)/$($uri.AbsolutePath.Trim('/'))"
  } catch {
    return "base configurada en DATABASE_URL"
  }
}
