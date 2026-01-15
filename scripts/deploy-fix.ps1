$ErrorActionPreference = "Stop"

Write-Host "=== Temp-Mail Fix & Deploy Script ==="

# 1. Install Dependencies
Write-Host "`nStep 1: Checking Dependencies..."
$wrangler = ".\node_modules\.bin\wrangler.cmd"

if (-not (Test-Path "node_modules") -or -not (Test-Path $wrangler)) {
    Write-Host "Installing dependencies (missing node_modules or wrangler)..."
    npm install --no-audit --no-fund --loglevel=error
} else {
    Write-Host "Dependencies appear to be installed."
}

# 2. Locate Wrangler
if (-not (Test-Path $wrangler)) {
    Write-Host "Local wrangler not found, trying global..."
    if (Get-Command "wrangler" -ErrorAction SilentlyContinue) {
        $wrangler = "wrangler"
    } else {
        Write-Error "Wrangler CLI not found. Please run 'npm install' manually."
        exit 1
    }
}

# 3. Get D1 Database ID
Write-Host "`nStep 2: Configuring Database..."
try {
    # Try to get list
    $json = & $wrangler d1 list --json
    if ($LASTEXITCODE -ne 0) { throw "Failed to list databases" }
    
    $list = $json | ConvertFrom-Json
    $db = $list | Where-Object { $_.name -eq 'temp_mail_db' }
    
    if (-not $db) {
        Write-Host "Creating database 'temp_mail_db'..."
        & $wrangler d1 create temp_mail_db
        $json = & $wrangler d1 list --json
        $list = $json | ConvertFrom-Json
        $db = $list | Where-Object { $_.name -eq 'temp_mail_db' }
    }
    
    if (-not $db) {
        Write-Error "Failed to find or create 'temp_mail_db'."
        exit 1
    }
    
    $id = $db.uuid
    if (-not $id) { $id = $db.id }
    
    Write-Host "Found Database ID: $id"
    
    # 4. Update wrangler.toml
    Write-Host "Updating wrangler.toml..."
    $content = Get-Content wrangler.toml -Raw
    # Replace placeholder
    $content = $content -replace '\$\{D1_DATABASE_ID\}', $id
    # Also replace if it was already replaced (to be safe)
    $content = $content -replace 'database_id = "[a-f0-9-]{36}"', "database_id = `"$id`""
    Set-Content wrangler.toml $content
    
} catch {
    Write-Error "Error configuring database: $_"
    exit 1
}

# 5. Deploy
Write-Host "`nStep 3: Deploying Worker..."
& $wrangler deploy

Write-Host "`n✅ Deployment Successful!"
