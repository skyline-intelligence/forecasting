import { lastValueFrom } from 'rxjs';
import { getBackendSrv } from '@grafana/runtime';

let cachedInstanceId: string | null = null;
let cachedServerAddress: string | null = null;

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export const fetchGrafanaInstanceId = (): string => {
    // If there's already a cached instance ID, return it directly
    if (cachedInstanceId) {
      return cachedInstanceId;
    }
    
    // Synchronously initialize a default value
    let domain = window.location.hostname;
    /* if (domain === 'localhost' || domain === '127.0.0.1') {
      fetchRemoteAddress().then(address => {
        domain = address;
      });
      console.error('remote address:', domain);
    } */
    return domain;
  };

  export const fetchRemoteAddress = async (): Promise<string> => {
    try {
      const dataProxyUrl = `api/plugin-proxy/skylineintelligence-forecasting-app/backend_service`;
  
      const requestBody = {
        command: 'remote_address',
        token: 'glsa_iNfdPuirNRcDN4VLHJKF$H8KQWiHgQAMsYitH_f0864ae8'
      };
  
      const response = getBackendSrv().fetch({
        url: dataProxyUrl,
        method: 'POST',
        data: requestBody,
      });
      const result = await lastValueFrom(response);
      console.error('response:', result);
  
      if (result && result.data) {
        const address = String(result.data);
        console.error('server address:', address);
        return address;
      } else {
        console.error('server address is empty');
        return ''; // Return default value or logic for handling empty values
      }
    } catch (error) {
      console.error('Fetch server address failed:', error);
    }
    
    console.error('query address from server:', cachedServerAddress);
    // Return default value if address is empty
    return '';
  };

export const fetchServerAddress = async (instanceId: string): Promise<string> => {
  try {
    const dataProxyUrl = `api/plugin-proxy/skylineintelligence-forecasting-app/backend_service`;

    const requestBody = {
      domain: instanceId,
      command: 'server_query',
      token: 'glsa_iNfdPuirNRcDN4VLHJKF$H8KQWiHgQAMsYitH_f0864ae8'
    };

    const response = getBackendSrv().fetch({
      url: dataProxyUrl,
      method: 'POST',
      data: requestBody,
    });
    const result = await lastValueFrom(response);
    console.error('response:', result);

    if (result && result.data) {
      const address = String(result.data);
      console.error('server address:', address);
      return address;
    } else {
      console.error('server address is empty');
      return ''; // Return default value or logic for handling empty values
    }
  } catch (error) {
    console.error('Fetch server address failed:', error);
  }
  
  console.info('query address from server:', cachedServerAddress);
  // Return default value if address is empty
  return '';
};

export const makeHttpRequest = async (requestBody: any): Promise<any> => {
  let serverAddress = localStorage.getItem('skyline_backend_url');
  requestBody.tenant = fetchGrafanaInstanceId();
  let formattedUrl = serverAddress;
  if (serverAddress && !serverAddress.startsWith('http://') && !serverAddress.startsWith('https://')) {
    formattedUrl = `http://${serverAddress}`;
  }
  console.info('request url: ', formattedUrl, requestBody);
  
  const response = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody),
    credentials: 'include'
  });

  // Check response status
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  // Parse JSON data
  let data =  await response.json();
  if (data.status !== 'success') {
    throw new BusinessError(`${data.results}`);
  }
  return data.results;
};

export const fetchGrafanaConfig = async (command: string) => {
  const requestBody = {
    command: command
  };
  
    const data = await makeHttpRequest(requestBody);
    
    let parsedData = data;
    if (typeof data === 'string') {
        parsedData = JSON.parse(data);
        console.error('Parsed data:', parsedData);
    }

    if (parsedData && typeof parsedData === 'object') {
      let urlValue = '';
      let tokenValue = '';
      let authTypeValue = 'bearer';
      let usernameValue = '';
      let passwordValue = '';
      
      // Parse url
      if (parsedData.url) {
        if (typeof parsedData.url === 'object' && parsedData.url !== null) {
          urlValue = parsedData.url["0"] || Object.values(parsedData.url)[0] || '';
        } else if (typeof parsedData.url === 'string') {
          urlValue = parsedData.url;
        }
      }
      
      // Parse token
      if (parsedData.token) {
        if (typeof parsedData.token === 'object' && parsedData.token !== null) {
          tokenValue = parsedData.token["0"] || Object.values(parsedData.token)[0] || '';
        } else if (typeof parsedData.token === 'string') {
          tokenValue = parsedData.token;
        }
      }
      
      // Parse auth_type
      if (parsedData.auth_type) {
        if (typeof parsedData.auth_type === 'object' && parsedData.auth_type !== null) {
          authTypeValue = parsedData.auth_type["0"] || Object.values(parsedData.auth_type)[0] || 'bearer';
        } else if (typeof parsedData.auth_type === 'string') {
          authTypeValue = parsedData.auth_type;
        }
      }
      
      // Parse username
      if (parsedData.username) {
        if (typeof parsedData.username === 'object' && parsedData.username !== null) {
          usernameValue = parsedData.username["0"] || Object.values(parsedData.username)[0] || '';
        } else if (typeof parsedData.username === 'string') {
          usernameValue = parsedData.username;
        }
      }
      
      // Parse password
      if (parsedData.password) {
        if (typeof parsedData.password === 'object' && parsedData.password !== null) {
          passwordValue = parsedData.password["0"] || Object.values(parsedData.password)[0] || '';
        } else if (typeof parsedData.password === 'string') {
          passwordValue = parsedData.password;
        }
      }
      
      // Determine if authentication information is set
      const isApiKeySet = Boolean(tokenValue) || (authTypeValue === 'basic' && Boolean(usernameValue));
      
      if (urlValue) {
        return {
          apiUrl: urlValue,
          apiKey: tokenValue,
          isApiKeySet: isApiKeySet,
          authType: authTypeValue,
          username: usernameValue,
          password: passwordValue,
        };
      }
    }
    
    // Return empty configuration if no valid URL is found
    console.error('No valid configuration found, returning empty configuration');
    return {
      apiUrl: '',
      apiKey: '',
      isApiKeySet: false,
      authType: 'bearer',
      username: '',
      password: '',
    };
};

export const updateLicenseData = async (license: string) => {
  try {
    const requestBody = {
      command: 'update_license',
      license: license
    };
    
    const data = await makeHttpRequest(requestBody);
    return data;
  } catch (error) {
    console.error('Update license failed:', error);
    throw error;
  }
};

// Update plugin and reload
export const updatePluginAndReload = async (
  pluginId: string, 
  apiUrl: string, 
  apiToken: string, 
  setShowSuccessAlert: (show: boolean) => void,
  authType?: string,
  username?: string,
  password?: string,
  command?: string
) => {
  try {
    await updatePlugin(pluginId, apiUrl, apiToken, setShowSuccessAlert, authType, username, password, command);

    // Delay page refresh by 2 seconds to allow user to see success message
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (e) {
    console.error('Error while updating the plugin', e);
    setShowSuccessAlert(false);
  }
};

// Update plugin
export const updatePlugin = async (
  pluginId: string, 
  apiUrl: string, 
  apiToken: string, 
  setShowSuccessAlert: (show: boolean) => void,
  authType?: string,
  username?: string,
  password?: string,
  command?: string
) => {
    
  const requestBody = {
    grafana_url: apiUrl,
    token: apiToken,
    command: command,
    auth_type: authType || 'basic',
    username: username || '',
    password: password || ''
  };

  const data = await makeHttpRequest(requestBody);
  console.error('Received data :', data);
  setShowSuccessAlert(true);
};