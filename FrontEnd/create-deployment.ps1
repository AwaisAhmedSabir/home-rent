# Frontend Deployment Script for Azure Web App
# This script creates a deployment ZIP for Linux Node.js Azure Web App
# Can be run from project root OR from FrontEnd directory

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Creating Frontend Deployment Package" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Determine the FrontEnd directory path
$currentDir = Get-Location
$frontEndPath = if (Test-Path "FrontEnd") { 
    Join-Path $currentDir "FrontEnd"
} elseif (Test-Path "package.json" -and Test-Path "vite.config.js") {
    # We're already in FrontEnd directory
    $currentDir
} else {
    Write-Host "ERROR: Script must be run from project root or FrontEnd directory" -ForegroundColor Red
    exit 1
}

Set-Location $frontEndPath
Write-Host "Working directory: $frontEndPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Build the frontend
Write-Host "Step 1: Building frontend for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "X Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "OK Build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Create server.js in dist folder for Node.js serving
Write-Host "Step 2: Creating server.js for static file serving..." -ForegroundColor Yellow
$serverJsContent = @'
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
'@

$serverJsPath = Join-Path "dist" "server.js"
$serverJsContent | Out-File -FilePath $serverJsPath -Encoding UTF8
Write-Host "OK server.js created" -ForegroundColor Green
Write-Host ""

# Step 3: Create package.json in dist folder
Write-Host "Step 3: Creating package.json for deployment..." -ForegroundColor Yellow
$packageJsonContent = @{
    name = "home-rent-frontend-server"
    version = "1.0.0"
    description = "Server for HomeRent frontend"
    main = "server.js"
    scripts = @{
        start = "node server.js"
    }
    dependencies = @{
        express = "^4.18.2"
    }
} | ConvertTo-Json -Depth 10

$packageJsonPath = Join-Path "dist" "package.json"
$packageJsonContent | Out-File -FilePath $packageJsonPath -Encoding UTF8
Write-Host "OK package.json created" -ForegroundColor Green
Write-Host ""

# Step 4: Copy web.config for Windows App Service (if needed)
Write-Host "Step 4: Copying web.config..." -ForegroundColor Yellow
if (Test-Path "web.config") {
    Copy-Item "web.config" -Destination "dist\web.config" -Force
    Write-Host "OK web.config copied" -ForegroundColor Green
} else {
    Write-Host "WARNING: web.config not found (optional for Linux)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Create deployment ZIP
Write-Host "Step 5: Creating deployment ZIP..." -ForegroundColor Yellow
$distPath = Join-Path $frontEndPath "dist"
Set-Location $distPath

# Remove old zip if exists (in FrontEnd directory, not dist)
$zipPath = Join-Path $frontEndPath "deploy-frontend.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create ZIP with all contents of dist folder
Compress-Archive -Path * -DestinationPath $zipPath -Force

Set-Location $frontEndPath

if (Test-Path "deploy-frontend.zip") {
    $zipSize = [math]::Round((Get-Item "deploy-frontend.zip").Length / 1MB, 2)
    Write-Host "OK Deployment ZIP created: deploy-frontend.zip ($zipSize MB)" -ForegroundColor Green
} else {
    Write-Host "X Failed to create ZIP file!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Package Ready!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Azure Portal -> Your Web App" -ForegroundColor White
Write-Host "2. Go to Deployment Center or Advanced Tools (Kudu)" -ForegroundColor White
Write-Host "3. Upload deploy-frontend.zip" -ForegroundColor White
Write-Host "4. Extract to wwwroot or site/wwwroot" -ForegroundColor White
Write-Host "5. Set startup command: npm install; npm start" -ForegroundColor White
Write-Host ""
