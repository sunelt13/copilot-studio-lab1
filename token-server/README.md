# Token Server — Direct Line Token Exchange

Azure Function that exchanges the permanent Direct Line **secret** for a short-lived (30-minute) **token**, keeping the secret server-side and out of client code.

## Architecture

```
Browser (GitHub Pages) → POST /api/directline-token → Azure Function
   ↓                                                        ↓
Receives disposable token                          Calls Direct Line /tokens/generate
   ↓                                              with DIRECT_LINE_SECRET env var
Web Chat SDK connects with token
```

## Local Development

```bash
cd token-server
npm install
# Edit local.settings.json → set DIRECT_LINE_SECRET
func start
```

## Deploy to Azure

### Prerequisites
- Azure CLI (`az`) installed and authenticated
- Azure Functions Core Tools v4 (`func`)

### Steps

```bash
# 1. Login
az login

# 2. Create resource group (skip if exists)
az group create --name rg-copilot-lab --location eastus

# 3. Create storage account (required by Functions)
az storage account create \
  --name stcopilotlabfunc \
  --resource-group rg-copilot-lab \
  --location eastus \
  --sku Standard_LRS

# 4. Create the Function App (Consumption plan, Node 20)
az functionapp create \
  --name copilot-lab-token-server \
  --resource-group rg-copilot-lab \
  --storage-account stcopilotlabfunc \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux

# 5. Set the Direct Line secret
az functionapp config appsettings set \
  --name copilot-lab-token-server \
  --resource-group rg-copilot-lab \
  --settings "DIRECT_LINE_SECRET=<YOUR_SECRET_HERE>"

# 6. Configure CORS
az functionapp cors add \
  --name copilot-lab-token-server \
  --resource-group rg-copilot-lab \
  --allowed-origins "https://sunelt13.github.io"

# 7. Deploy
cd token-server
func azure functionapp publish copilot-lab-token-server
```

### After Deploy

Update `TOKEN_URL` in `index.html`:
```javascript
const TOKEN_URL = 'https://copilot-lab-token-server.azurewebsites.net/api/directline-token';
```

## Getting the Direct Line Secret

1. Open [Copilot Studio](https://copilotstudio.microsoft.com)
2. Select your agent → **Settings** → **Channels** → **Direct Line**
3. Copy either **Secret 1** or **Secret 2**

## Security Notes

- The secret **never** leaves the Azure Function — only short-lived tokens reach the browser
- Tokens expire after ~30 minutes; the client gets a fresh one on each panel open
- CORS restricts access to `https://sunelt13.github.io` only
- Auth level is `anonymous` (no function key needed) since the endpoint produces time-limited tokens
