# fix-imports.ps1
Write-Host "Starting import fixes..." -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan

# Create missing api.client.js
$apiClientPath = "src/utils/api.client.js"
if (-not (Test-Path $apiClientPath)) {
    Write-Host "Creating missing $apiClientPath..." -ForegroundColor Yellow
    @"
// frontend/src/utils/api.client.js
// Re-export from api.endpoints.js for compatibility
export { apiCall, api, directApiCall, apiClient } from './api.endpoints.js';
export default apiClient;
"@ | Out-File -FilePath $apiClientPath -Encoding UTF8
    Write-Host "Created $apiClientPath" -ForegroundColor Green
}

# Create missing http.service.js
$httpServicePath = "src/services/http.service.js"
if (-not (Test-Path $httpServicePath)) {
    Write-Host "Creating missing $httpServicePath..." -ForegroundColor Yellow
    @"
// frontend/src/services/http.service.js
import { apiCall, api, directApiCall, apiClient } from '../utils/api.endpoints.js';

// HTTP Client
export const httpClient = {
  get: async (url, config = {}) => {
    return directApiCall(url, { method: 'GET', ...config });
  },
  
  post: async (url, data, config = {}) => {
    return directApiCall(url, { method: 'POST', data, ...config });
  },
  
  put: async (url, data, config = {}) => {
    return directApiCall(url, { method: 'PUT', data, ...config });
  },
  
  delete: async (url, config = {}) => {
    return directApiCall(url, { method: 'DELETE', ...config });
  },
  
  patch: async (url, data, config = {}) => {
    return directApiCall(url, { method: 'PATCH', data, ...config });
  },
};

// Analytics Client
export const analyticsClient = {
  getAnalytics: async (brokerId) => {
    return apiCall('BROKER_ANALYTICS', { brokerId });
  },
  
  getStats: async (brokerId) => {
    return apiCall('BROKER_STATS', { brokerId });
  },
  
  getTransactions: async (brokerId) => {
    return apiCall('BROKER_TRANSACTIONS', { brokerId });
  },
  
  get: async (url, config = {}) => {
    return directApiCall(url, { method: 'GET', ...config });
  }
};

// Chat Client
export const chatClient = {
  sendMessage: async (data) => {
    return apiCall('SEND_MESSAGE', {}, { data });
  },
  
  getConversations: async (userId) => {
    return apiCall('GET_CONVERSATIONS', { userId });
  },
  
  getMessages: async (conversationId) => {
    const response = await httpClient.get(
      'http://localhost:5001/api/messages/conversation/' + conversationId
    );
    return response;
  },
};

// Notifications Client
export const notificationsClient = {
  get: async (url, config = {}) => {
    return directApiCall(url, { method: 'GET', ...config });
  },
  
  put: async (url, data, config = {}) => {
    return directApiCall(url, { method: 'PUT', data, ...config });
  },
  
  post: async (url, data, config = {}) => {
    return directApiCall(url, { method: 'POST', data, ...config });
  },
  
  delete: async (url, config = {}) => {
    return directApiCall(url, { method: 'DELETE', ...config });
  }
};

// For backward compatibility
export const httpService = httpClient;
export default { 
  httpClient, 
  analyticsClient, 
  chatClient, 
  notificationsClient,
  httpService 
};
"@ | Out-File -FilePath $httpServicePath -Encoding UTF8
    Write-Host "Created $httpServicePath" -ForegroundColor Green
}

# Fix specific files manually
Write-Host "`nFixing specific files..." -ForegroundColor Cyan

# Fix BrokerPropertiesList.jsx
$brokerPropsPath = "src/components/BrokerPropertiesList.jsx"
if (Test-Path $brokerPropsPath) {
    $content = Get-Content $brokerPropsPath -Raw
    # Fix the import lines
    $content = $content -replace 'import \{ apiCall \} from \"\.\./utils/api\.endpoints\"', 'import { apiCall } from "../utils/api.endpoints.js"'
    $content = $content -replace 'import \{ apiClient \} from \"\.\./utils/api\.client\"', 'import { apiClient } from "../utils/api.client.js"'
    Set-Content $brokerPropsPath -Value $content -NoNewline
    Write-Host "Fixed BrokerPropertiesList.jsx" -ForegroundColor Green
}

# Fix BrokerDashboard.jsx
$brokerDashboardPath = "src/components/BrokerDashboard.jsx"
if (Test-Path $brokerDashboardPath) {
    $content = Get-Content $brokerDashboardPath -Raw
    # Look for the apiCall import line
    $content = $content -replace 'import \{ apiCall \} from \"\.\./\.\./utils/api\.endpoints\"', 'import { apiCall } from "../../utils/api.endpoints.js"'
    Set-Content $brokerDashboardPath -Value $content -NoNewline
    Write-Host "Fixed BrokerDashboard.jsx" -ForegroundColor Green
}

# Fix useAnalytics.js
$useAnalyticsPath = "src/hooks/useAnalytics.js"
if (Test-Path $useAnalyticsPath) {
    $content = Get-Content $useAnalyticsPath -Raw
    $content = $content -replace 'import \{ API_CONFIG \} from \"\.\./config/api\.config\"', 'import API_CONFIG from "../config/api.config.js"'
    Set-Content $useAnalyticsPath -Value $content -NoNewline
    Write-Host "Fixed useAnalytics.js" -ForegroundColor Green
}

# Fix socket.service.js
$socketServicePath = "src/services/socket.service.js"
if (Test-Path $socketServicePath) {
    $content = Get-Content $socketServicePath -Raw
    $content = $content -replace 'import \{ API_CONFIG \} from \"\.\./config/api\.config\"', 'import API_CONFIG from "../config/api.config.js"'
    Set-Content $socketServicePath -Value $content -NoNewline
    Write-Host "Fixed socket.service.js" -ForegroundColor Green
}

# Fix useNotifications.js
$useNotificationsPath = "src/hooks/useNotifications.js"
if (Test-Path $useNotificationsPath) {
    $content = Get-Content $useNotificationsPath -Raw
    $content = $content -replace 'import \{ notificationsClient \} from \"\.\./services/http\.service\"', 'import { notificationsClient } from "../services/http.service.js"'
    Set-Content $useNotificationsPath -Value $content -NoNewline
    Write-Host "Fixed useNotifications.js" -ForegroundColor Green
}

# Add named export to api.config.js
$apiConfigPath = "src/config/api.config.js"
if (Test-Path $apiConfigPath) {
    $content = Get-Content $apiConfigPath -Raw
    if ($content -notmatch 'export\s*{\s*API_CONFIG\s*}') {
        # Add named export
        $newContent = $content -replace 'export default API_CONFIG;', "export { API_CONFIG };`nexport default API_CONFIG;"
        Set-Content $apiConfigPath -Value $newContent -NoNewline
        Write-Host "Added named export to api.config.js" -ForegroundColor Green
    }
}

# Check if api.endpoints.js has directApiCall
$apiEndpointsPath = "src/utils/api.endpoints.js"
if (Test-Path $apiEndpointsPath) {
    $content = Get-Content $apiEndpointsPath -Raw
    
    # Check if directApiCall exists
    if ($content -notmatch 'export.*directApiCall') {
        Write-Host "Adding directApiCall to api.endpoints.js..." -ForegroundColor Yellow
        # Simple directApiCall function
        $directApiCallFunction = @"

// Direct API call function (for direct URLs)
export async function directApiCall(url, options = {}) {
  console.log(\`Direct API Call: \${url}\`, options);
  
  const token = localStorage.getItem('token');
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };
  
  if (!(options.body instanceof FormData) && !(options.data instanceof FormData)) {
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
  }
  
  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.data ? JSON.stringify(options.data) : options.body,
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      let errorMessage = \`HTTP \${response.status}\`;
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch {
        // Ignore parsing errors
      }
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { text };
      }
    }
    
    console.log(\`Direct API Success: \${url}\`, data);
    return data;
    
  } catch (error) {
    console.error(\`Direct API Error: \${url}\`, error.message);
    throw error;
  }
}
"@
        
        # Add it after the replacePathParams function
        $newContent = $content -replace '(// Helper to replace path parameters[\s\S]*?\n)(// Main API call function)', "`$1$directApiCallFunction`n`n`$2"
        Set-Content $apiEndpointsPath -Value $newContent -NoNewline
        Write-Host "Added directApiCall to api.endpoints.js" -ForegroundColor Green
    }
}

Write-Host "`nFixes completed!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "`nPlease restart your dev server!" -ForegroundColor Red