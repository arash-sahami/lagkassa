@description('Project name used as prefix for all resources')
param projectName string = 'lagkassa'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure region for Static Web App (limited regions supported)')
@allowed([
  'westeurope'
  'eastus2'
  'westus2'
  'eastasia'
  'centralus'
])
param staticWebAppLocation string = 'westeurope'

// ── Unique suffix so resource names don't clash ────────────────
var suffix = uniqueString(resourceGroup().id)
var cosmosName = '${projectName}-cosmos-${suffix}'
var swaName    = '${projectName}-web'

// ── Cosmos DB (Serverless – pay per request, no minimum cost) ──
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'

    // Single region, no redundancy
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]

    // Serverless – no provisioned RU/s, no free-tier conflict
    capabilities: [
      { name: 'EnableServerless' }
    ]

    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }

    // Cheapest backup: local redundancy, infrequent
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 1440   // once per day
        backupRetentionIntervalInHours: 48
        backupStorageRedundancy: 'Local'
      }
    }

    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    disableKeyBasedMetadataWriteAccess: false
    enableAnalyticalStorage: false
    enablePartitionMerge: false
    publicNetworkAccess: 'Enabled'
  }
}

// ── Cosmos DB Database ─────────────────────────────────────────
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  parent: cosmosAccount
  name: 'lagkassa'
  properties: {
    resource: { id: 'lagkassa' }
  }
}

// ── Cosmos DB Container ────────────────────────────────────────
resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = {
  parent: cosmosDatabase
  name: 'data'
  properties: {
    resource: {
      id: 'data'
      partitionKey: {
        paths: [ '/id' ]
        kind: 'Hash'
        version: 2
      }
      // Minimal indexing to save RU/s cost
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [ { path: '/*' } ]
        excludedPaths: [ { path: '/"_etag"/?' } ]
      }
      defaultTtl: -1  // no expiry
    }
  }
}

// ── Azure Static Web Apps (Free tier) ─────────────────────────
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swaName
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Disabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// ── Outputs ────────────────────────────────────────────────────
@description('Cosmos DB endpoint URL')
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint

@description('Cosmos DB account name (needed to retrieve keys via CLI)')
output cosmosAccountName string = cosmosAccount.name

@description('Cosmos DB primary connection string – store this as a GitHub Secret')
output cosmosConnectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString

@description('Static Web App default hostname')
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'

@description('Static Web App name')
output staticWebAppName string = staticWebApp.name

@description('Static Web App deploy token – store this as GitHub Secret AZURE_STATIC_WEB_APPS_API_TOKEN')
output staticWebAppDeployToken string = staticWebApp.listSecrets().properties.apiKey
