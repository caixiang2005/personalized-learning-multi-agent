# Clone and start official Dify on port 8080
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$DifyDir = if ($env:DIFY_HOME) { $env:DIFY_HOME } else { Join-Path $Root "dify-src" }
$Port = if ($env:DIFY_PORT) { $env:DIFY_PORT } else { "8080" }

if (-not (Test-Path (Join-Path $DifyDir "docker\docker-compose.yaml"))) {
  Write-Host "[dify] cloning langgenius/dify (shallow)..."
  git clone --depth 1 https://github.com/langgenius/dify.git $DifyDir
}

Set-Location (Join-Path $DifyDir "docker")
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  $envText = Get-Content ".env" -Raw
  if ($envText -match "EXPOSE_NGINX_PORT=") {
    $envText = $envText -replace "EXPOSE_NGINX_PORT=.*", "EXPOSE_NGINX_PORT=$Port"
  } else {
    $envText += "`nEXPOSE_NGINX_PORT=$Port`n"
  }
  if ($envText -match "(?m)^NGINX_PORT=") {
    $envText = $envText -replace "(?m)^NGINX_PORT=.*", "NGINX_PORT=$Port"
  }
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) ".env"), $envText, [System.Text.UTF8Encoding]::new($false))
}

Write-Host "[dify] docker compose up -d (first pull is slow)..."
docker compose up -d
Write-Host "[dify] console -> http://127.0.0.1:$Port"
