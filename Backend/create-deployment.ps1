# Backend Deployment Script for Azure Web App
# This script creates a deployment ZIP for Node.js Azure Web App

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Creating Backend Deployment Package" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location Backend

# Step 1: Clean old deployment files
Write-Host "Step 1: Cleaning old deployment files..." -ForegroundColor Yellow
if (Test-Path "deploy-backend.zip") {
    Remove-Item "deploy-backend.zip" -Force
    Write-Host "✓ Old deployment ZIP removed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Create temp deployment folder
Write-Host "Step 2: Preparing deployment files..." -ForegroundColor Yellow
$deployFolder = "deploy-temp"
if (Test-Path $deployFolder) {
    Remove-Item $deployFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $deployFolder | Out-Null

# Step 3: Copy necessary files (excluding node_modules, .env, uploads)
Write-Host "Step 3: Copying source files..." -ForegroundColor Yellow

# Copy all files and folders except excluded ones
$excludePatterns = @("node_modules", ".env", "uploads", "*.log", "deploy-temp", "deploy-backend.zip")

Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    
    foreach ($pattern in $excludePatterns) {
        if ($item.FullName -like "*\$pattern" -or $item.FullName -like "*\$pattern\*" -or $item.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    return -not $shouldExclude
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $targetPath = Join-Path $deployFolder $relativePath
    
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    } else {
        $targetDir = Split-Path $targetPath -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item $_.FullName -Destination $targetPath -Force
    }
}

Write-Host "✓ Source files copied" -ForegroundColor Green
Write-Host ""

# Step 4: Ensure uploads directory exists (empty, for local fallback)
Write-Host "Step 4: Creating uploads directory..." -ForegroundColor Yellow
$uploadsDir = Join-Path $deployFolder "uploads"
New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
# Add .gitkeep to ensure directory is created on deployment
$gitkeep = Join-Path $uploadsDir ".gitkeep"
"# This directory is for local file storage fallback" | Out-File -FilePath $gitkeep -Encoding UTF8
Write-Host "✓ uploads directory created" -ForegroundColor Green
Write-Host ""

# Step 5: Create .env.example file for reference
Write-Host "Step 5: Creating .env.example..." -ForegroundColor Yellow
$envExample = @"
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration (Use Azure Cosmos DB connection string)
MONGODB_URI=your-mongodb-connection-string

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Origin (Frontend URL)
CORS_ORIGIN=https://your-frontend-url.azurewebsites.net

# Azure Blob Storage Configuration (Optional - for file storage)
# If not provided, files will be stored locally in uploads/ folder
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=your-container-name
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
"@

$envExamplePath = Join-Path $deployFolder ".env.example"
$envExample | Out-File -FilePath $envExamplePath -Encoding UTF8
Write-Host "✓ .env.example created" -ForegroundColor Green
Write-Host ""

# Step 6: Create deployment ZIP
Write-Host "Step 6: Creating deployment ZIP..." -ForegroundColor Yellow
Set-Location $deployFolder
Compress-Archive -Path * -DestinationPath "..\deploy-backend.zip" -Force
Set-Location ..

# Cleanup temp folder
Remove-Item $deployFolder -Recurse -Force

if (Test-Path "deploy-backend.zip") {
    $zipSize = (Get-Item "deploy-backend.zip").Length / 1MB
    Write-Host "✓ Deployment ZIP created: deploy-backend.zip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create ZIP file!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Package Ready!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Azure Portal -> Your Backend Web App" -ForegroundColor White
Write-Host "2. Set environment variables in Configuration -> Application Settings" -ForegroundColor White
Write-Host "3. Upload deploy-backend.zip via Deployment Center or Kudu" -ForegroundColor White
Write-Host "4. Run: npm install (if not using App Service Deployment)" -ForegroundColor White
Write-Host "5. Set startup command: node server.js" -ForegroundColor White
Write-Host ""

Set-Location ..
