# Deployment Guide

This guide explains how to create deployment packages for Azure Web Apps.

## Quick Start

### Option 1: Deploy Both (Recommended)
```powershell
.\deploy-all.ps1
```

### Option 2: Deploy Individually

**Frontend:**
```powershell
cd FrontEnd
.\create-deployment.ps1
```

**Backend:**
```powershell
cd Backend
.\create-deployment.ps1
```

## What Gets Created

### Frontend Deployment (`FrontEnd/deploy-frontend.zip`)
- Built production files from `dist/`
- `server.js` - Express server for serving static files
- `package.json` - Dependencies (express only)
- `web.config` - Windows App Service configuration (if needed)

### Backend Deployment (`Backend/deploy-backend.zip`)
- All source files (excluding `node_modules`, `.env`, `uploads/`)
- `package.json` with all dependencies
- `.env.example` - Template for environment variables
- Empty `uploads/` folder for local storage fallback

## Deployment Steps

### Frontend Deployment to Azure

1. **Create the deployment package:**
   ```powershell
   cd FrontEnd
   .\create-deployment.ps1
   ```

2. **Upload to Azure:**
   - Go to Azure Portal → Your Frontend Web App
   - Navigate to **Deployment Center** or **Advanced Tools (Kudu)**
   - Upload `deploy-frontend.zip`
   - Extract to `site/wwwroot` (Linux) or `wwwroot` (Windows)

3. **Set Startup Command** (for Linux Node.js):
   - Go to **Configuration** → **General Settings**
   - Startup Command: `npm install && npm start`

4. **Verify:**
   - Check logs to ensure server started
   - Visit your Web App URL

### Backend Deployment to Azure

1. **Create the deployment package:**
   ```powershell
   cd Backend
   .\create-deployment.ps1
   ```

2. **Set Environment Variables:**
   - Go to Azure Portal → Your Backend Web App
   - Navigate to **Configuration** → **Application Settings**
   - Add these settings:
     ```
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-secret-key
     CORS_ORIGIN=https://your-frontend-url.azurewebsites.net
     PORT=5000
     NODE_ENV=production
     
     # Azure Blob Storage (Optional)
     AZURE_STORAGE_CONNECTION_STRING=your-connection-string
     AZURE_STORAGE_CONTAINER_NAME=your-container-name
     AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
     ```

3. **Upload to Azure:**
   - Go to **Deployment Center** or **Advanced Tools (Kudu)**
   - Upload `deploy-backend.zip`
   - Extract to `site/wwwroot` (Linux) or `wwwroot` (Windows)

4. **Install Dependencies & Start:**
   - For **Linux Node.js**:
     - Startup Command: `npm install && node server.js`
   - For **Windows**:
     - Startup Command: `npm install && node server.js`

5. **Verify:**
   - Check logs to ensure server started
   - Visit: `https://your-backend-url.azurewebsites.net/api/health`

## Troubleshooting

### Frontend shows blank page
- Verify `server.js` and `package.json` are in the ZIP root
- Check startup command is set correctly
- Check logs for errors

### Backend fails to start
- Verify all environment variables are set
- Check MongoDB/Cosmos DB connection string
- Verify `package.json` is included in deployment
- Check logs for specific errors

### Files not uploading
- Check Azure Blob Storage connection string
- Verify container name and access level
- Check container allows anonymous access for public URLs

## Notes

- Deployment ZIPs are automatically excluded from git (see `.gitignore`)
- Always rebuild frontend before creating deployment package
- Environment variables should NEVER be committed to git
- Local `uploads/` folder is excluded from deployment (use Azure Blob Storage in production)
