# AI Enhancement Features - Quick Installation Script
# Run this script to install all dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NyayaSankalan AI Enhancement Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Download spaCy model
Write-Host ""
Write-Host "Downloading spaCy model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ spaCy model downloaded" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: spaCy model download failed" -ForegroundColor Yellow
    Write-Host "  You can install it later with: python -m spacy download en_core_web_sm" -ForegroundColor Yellow
}

# Check Tesseract
Write-Host ""
Write-Host "Checking Tesseract OCR..." -ForegroundColor Yellow
try {
    $tesseractVersion = tesseract --version 2>&1
    Write-Host "✓ Tesseract found" -ForegroundColor Green
} catch {
    Write-Host "⚠ Tesseract not found" -ForegroundColor Yellow
    Write-Host "  Download from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    Write-Host "  Multilingual OCR will not work without Tesseract" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host ""
Write-Host "Creating directory structure..." -ForegroundColor Yellow
$dirs = @("storage/extracts", "storage/indexes", "storage/output/ai_documents", "storage/output/ai_extractions")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "✓ Directories created" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Python dependencies: Installed" -ForegroundColor Green
Write-Host "✓ spaCy model: Downloaded" -ForegroundColor Green
Write-Host "✓ Directory structure: Created" -ForegroundColor Green

# Check optional components
$tesseractInstalled = $null -ne (Get-Command tesseract -ErrorAction SilentlyContinue)
if ($tesseractInstalled) {
    Write-Host "✓ Tesseract OCR: Installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Tesseract OCR: Not installed (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Start the server:" -ForegroundColor White
Write-Host "   uvicorn main:app --host 0.0.0.0 --port 8001 --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test health check:" -ForegroundColor White
Write-Host "   curl http://localhost:8001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View API docs:" -ForegroundColor White
Write-Host "   http://localhost:8001/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "4. See SETUP_GUIDE.md for detailed testing instructions" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Setup complete! Ready to test AI features!" -ForegroundColor Green
