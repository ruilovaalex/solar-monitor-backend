param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups"),
  [ValidateRange(1, 3650)][int]$RetentionDays = 14
)

. (Join-Path $PSScriptRoot "postgres-common.ps1")

$databaseUrl = Get-DatabaseUrl
$postgresConnectionUrl = Get-PostgresConnectionUrl -DatabaseUrl $databaseUrl
$pgDump = Find-PostgresTool -Name "pg_dump"
$resolvedOutput = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $resolvedOutput "solar_monitor_$timestamp.dump"
$checksumPath = "$backupPath.sha256"

Write-Host "Respaldando $(Get-DatabaseLabel -DatabaseUrl $databaseUrl)..."
& $pgDump --dbname=$postgresConnectionUrl --format=custom --no-owner --no-privileges --file=$backupPath
if ($LASTEXITCODE -ne 0) {
  $resolvedBackupPath = [IO.Path]::GetFullPath($backupPath)
  $directoryPrefix = $resolvedOutput.TrimEnd('\') + '\'
  if ((Test-Path -LiteralPath $resolvedBackupPath) -and $resolvedBackupPath.StartsWith($directoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedBackupPath -Force
  }
  throw "pg_dump termino con codigo $LASTEXITCODE."
}

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath
Set-Content -LiteralPath $checksumPath -Encoding ascii -Value "$($hash.Hash.ToLower())  $([IO.Path]::GetFileName($backupPath))"

$expirationDate = (Get-Date).AddDays(-$RetentionDays)
$directoryPrefix = $resolvedOutput.TrimEnd('\') + '\'
Get-ChildItem -LiteralPath $resolvedOutput -File |
  Where-Object { $_.LastWriteTime -lt $expirationDate -and ($_.Extension -eq ".dump" -or $_.Name.EndsWith(".dump.sha256")) } |
  ForEach-Object {
    $candidatePath = [IO.Path]::GetFullPath($_.FullName)
    if (-not $candidatePath.StartsWith($directoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Se rechazo eliminar un archivo fuera de la carpeta de respaldos: $candidatePath"
    }
    Remove-Item -LiteralPath $candidatePath -Force
  }

Write-Host "Respaldo creado: $backupPath"
Write-Host "SHA256: $($hash.Hash.ToLower())"
