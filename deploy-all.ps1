# Deploy Both Frontend and Backend
# This script creates deployment packages for both applications

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "HomeRent - Full Deployment Package Creator" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "FrontEnd") -or -not (Test-Path "Backend")) {
    Write-Host "✗ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Create Frontend deployment
Write-Host "Creating Frontend deployment package..." -ForegroundColor Yellow
Write-Host ""
& ".\FrontEnd\create-deployment.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend deployment package creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Create Backend deployment
Write-Host "Creating Backend deployment package..." -ForegroundColor Yellow
Write-Host ""
& ".\Backend\create-deployment.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend deployment package creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "All Deployment Packages Created Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Yellow
Write-Host "  - FrontEnd\deploy-frontend.zip" -ForegroundColor White
Write-Host "  - Backend\deploy-backend.zip" -ForegroundColor White
Write-Host ""
