param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [switch]$Force
)

. (Join-Path $PSScriptRoot "postgres-common.ps1")

if (-not $Force) {
  throw "La restauracion reemplaza los datos actuales. Vuelve a ejecutar con -Force despues de detener el backend."
}

$resolvedBackup = [IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) {
  throw "No existe el respaldo: $resolvedBackup"
}

$databaseUrl = Get-DatabaseUrl
$postgresConnectionUrl = Get-PostgresConnectionUrl -DatabaseUrl $databaseUrl
$pgRestore = Find-PostgresTool -Name "pg_restore"

& $pgRestore --list $resolvedBackup | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "El archivo no es un respaldo valido de pg_dump."
}

Write-Host "Restaurando $(Get-DatabaseLabel -DatabaseUrl $databaseUrl) desde $resolvedBackup..."
& $pgRestore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname=$postgresConnectionUrl $resolvedBackup
if ($LASTEXITCODE -ne 0) {
  throw "pg_restore termino con codigo $LASTEXITCODE."
}

Write-Host "Restauracion completada. Ejecuta npm run prisma:status antes de iniciar el backend."
