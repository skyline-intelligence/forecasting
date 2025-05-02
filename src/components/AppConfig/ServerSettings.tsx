import React, { useState, useEffect } from 'react';
import { Button, Input, Form, Space, Typography, Card, Descriptions, message } from 'antd';
import { EditOutlined, LinkOutlined, SaveOutlined } from '@ant-design/icons';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { makeHttpRequest } from 'utils/api';

const { Title, Text } = Typography;

interface ServerSettingsProps {
  serverAddress: string;
  setServerAddress: (address: string) => void;
  grafanaInstanceId: string;
}

const ServerSettings: React.FC<ServerSettingsProps> = ({ 
  serverAddress, 
  setServerAddress,
  grafanaInstanceId
}) => {
  const [isTestingServer, setIsTestingServer] = React.useState(false);
  const [isSavingServer, setIsSavingServer] = React.useState(false);
  const [localAddress, setLocalAddress] = useState('');
  
  // Update local state when parent component's serverAddress changes
  useEffect(() => {
    setLocalAddress(serverAddress);
  }, [serverAddress]);

  // Test server connection
  const testServerConnection = async () => {
    if (!localAddress) {
      message.error('Please input server address');
      return;
    }
    
    setIsTestingServer(true);
    try {
      // Implement server connection test logic here
      const serverAddress = `${localAddress.replace(/\/+$/, '')}`;

      const requestBody = {
        command: 'connection'
      };

      let formattedUrl = serverAddress;
      if (serverAddress && !serverAddress.startsWith('http://') && !serverAddress.startsWith('https://')) {
        formattedUrl = `http://${serverAddress}`;
      }
      console.error('request url: ', formattedUrl, requestBody);
      
      const response = await fetch(formattedUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      console.error('response:', response);
      // Check response status
      if (!response.ok) {
        throw new Error(`request failed: ${response.statusText}`);
      }
      // Parse JSON data
      let result =  await response.json();
      if (result.results === 'ok') {
        message.success('Connect to server successfully');
      } else {
        message.error(`Connect failed: ${result.statusText}`);
      }
    } catch (error) {
      console.error('Test connect server failed:', error);
      message.error(`Connect failed: ${error}`);
    } finally {
      setIsTestingServer(false);
    }
  };
  
  // Save server settings
  const saveServerSettings = async () => {
    if (!localAddress) {
      message.error('Please input server address');
      return;
    }
    
    // Update parent component state
    setServerAddress(localAddress);
    
    setIsSavingServer(true);
    try {
      // Save to local storage
      localStorage.setItem('skyline_backend_url', localAddress);
      
      // Implement logic to save server settings
      const dataProxyUrl = `api/plugin-proxy/skylineintelligence-forecasting-app/backend_service`;
      
      const requestBody = {
        domain: grafanaInstanceId,
        address: localAddress,
        command: 'server_register',
        token: 'glsa_iNfdPuirNRcDN4VLHJKF$H8KQWiHgQAMsYitH_f0864ae8'
      };
      
      const response = getBackendSrv().fetch({
        url: dataProxyUrl,
        method: 'POST',
        data: requestBody,
      });

      const result = await lastValueFrom(response);
      
      if (result.status == 200) {
        const errorMessage = result.data.message;
        message.error(errorMessage);
      } else {
        message.success('Server address saved successfully');
      }
    } catch (error) {
      console.error('save server address failed:', error);
    } finally {
      setIsSavingServer(false);
    }
  };

  return (
    <Card 
      title={<Title level={4}>Server Settings</Title>} 
      bordered={false}
      style={{ marginBottom: 16 }}
    >
      {serverAddress ? (
        <>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Server Address">
              <Text>{serverAddress}</Text>
            </Descriptions.Item>
          </Descriptions>
          
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setServerAddress('')}
            >
              Update Server Settings
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Server Address</label>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }}>
              Please input server address, such as: http://www.example.com
            </div>
          </div>
          <Input 
            placeholder="Please input server address"
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button 
              type="default" 
              icon={<LinkOutlined />} 
              onClick={testServerConnection}
              loading={isTestingServer}
            >
              Test Connection
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveServerSettings}
              loading={isSavingServer}
            >
              Save Settings
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default ServerSettings;