# deploy.ps1 – Deploy Lagkassa infrastructure to Azure
# Run from the repo root: .\infra\deploy.ps1

param(
  [string]$ResourceGroup = "rg-lagkassa",
  [string]$Location      = "westeurope"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "=== Lagkassa Infrastructure Deploy ===" -ForegroundColor Cyan

# 1. Login check
Write-Host "`n[1/4] Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
  Write-Host "Not logged in. Running az login..." -ForegroundColor Yellow
  az login
}
Write-Host "  Logged in as: $($account.user.name)" -ForegroundColor Green

# 2. Create resource group
Write-Host "`n[2/4] Creating resource group '$ResourceGroup' in '$Location'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "  Done." -ForegroundColor Green

# 3. Deploy Bicep
Write-Host "`n[3/4] Deploying Bicep template..." -ForegroundColor Yellow
$deployment = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot\main.bicep" `
  --parameters "$PSScriptRoot\main.bicepparam" `
  --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
  Write-Host "Deployment failed!" -ForegroundColor Red
  exit 1
}

$outputs = $deployment.properties.outputs

# 4. Print secrets to add to GitHub
Write-Host "`n[4/4] Deployment complete!" -ForegroundColor Green
Write-Host "`n=== Add these as GitHub Secrets ===" -ForegroundColor Cyan
Write-Host "(Go to: https://github.com/arash-sahami/lagkassa/settings/secrets/actions)"
Write-Host ""
Write-Host "Secret name : AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
Write-Host "Secret value: $($outputs.staticWebAppDeployToken.value)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret name : COSMOS_CONNECTION_STRING" -ForegroundColor White
Write-Host "Secret value: $($outputs.cosmosConnectionString.value)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Static Web App URL: $($outputs.staticWebAppUrl.value)" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Next step ===" -ForegroundColor Cyan
Write-Host "Run the GitHub Actions workflow to deploy the app."
