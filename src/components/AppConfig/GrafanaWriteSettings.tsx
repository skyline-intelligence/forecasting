import React, { useState } from 'react';
import { Button, Input, Form, Modal, Space, Typography, Card, Descriptions, Radio, Divider } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { testIds } from '../testIds';

const { Title, Text } = Typography;
const { RadioGroup, RadioButton } = Radio;

interface GrafanaWriteSettingsProps {
  state: {
    apiUrl: string;
    apiKey: string;
    isApiKeySet: boolean;
    authType?: 'bearer' | 'basic';  // Changed to bearer and basic
    username?: string;
    password?: string;
  };
  pluginId: string;
  setShowSuccessAlert: (show: boolean) => void;
  updatePluginAndReload: (pluginId: string, apiUrl: string, apiToken: string, setShowSuccessAlert: (show: boolean) => void, authType?: string, username?: string, password?: string) => void;
}

const GrafanaWriteSettings: React.FC<GrafanaWriteSettingsProps> = ({ 
  state, 
  pluginId, 
  setShowSuccessAlert,
  updatePluginAndReload
}) => {
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState<'bearer' | 'basic'>(state.authType || 'bearer');  // Changed default value to bearer

  // Open update dialog
  const openUpdateModal = () => {
    form.setFieldsValue({
      apiUrl: state.apiUrl,
      authType: state.authType || 'bearer',  // Changed default value to bearer
      apiKey: '',  // Don't show API Key, let user input again
      username: state.username || '',
      password: '',  // Don't show password, let user input again
    });
    setAuthType(state.authType || 'bearer');  // Changed default value to bearer
    setShowUpdateModal(true);
  };

  // Submit update
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      updatePluginAndReload(
        pluginId, 
        values.apiUrl, 
        values.authType === 'bearer' ? values.apiKey : '',  // Changed to bearer
        setShowSuccessAlert,
        values.authType,
        values.authType === 'basic' ? values.username : '',  // Changed to basic
        values.authType === 'basic' ? values.password : ''   // Changed to basic
      );
      setShowUpdateModal(false);
    } catch (errorInfo) {
      console.error('Validation Failed:', errorInfo);
    }
  };

  // Handle authentication type change
  const handleAuthTypeChange = (e: any) => {
    const newAuthType = e.target.value;
    setAuthType(newAuthType);
    
    // Reset form fields based on authentication type
    if (newAuthType === 'bearer') {
      form.setFieldsValue({
        authType: newAuthType,
        apiUrl: form.getFieldValue('apiUrl'),  // Keep current URL
        apiKey: '',  // Reset API Key
        username: '',  // Clear username
        password: ''   // Clear password
      });
    } else {
      form.setFieldsValue({
        authType: newAuthType,
        apiUrl: form.getFieldValue('apiUrl'),  // Keep current URL
        apiKey: '',  // Clear API Key
        username: state.username || '',  // Set saved username
        password: ''  // Don't show password, let user input again
      });
    }
  };

  // Check if Grafana settings are configured
  const isConfigured = state.apiUrl && (state.isApiKeySet || (state.authType === 'basic' && state.username));  // Changed to basic

  return (
    <>
      <Card title={<Title level={4}>Metrice Write Settings</Title>} bordered={false}>
        {isConfigured ? (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Metrics Write Url">
                <Text>{state.apiUrl}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Auth Type">
                <Text>{state.authType === 'basic' ? 'Basic Auth' : 'Bearer Auth'}</Text>
              </Descriptions.Item>
              {state.authType === 'basic' ? (
                <>
                  <Descriptions.Item label="Username">
                    <Text>{state.username}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Password">
                    <Text>******</Text>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label="API Token">
                  <Text>{state.isApiKeySet ? state.apiKey : 'Not Set'}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={openUpdateModal}
                data-testid={testIds.appConfig.submit}
              >
                Update Metrics Write Settings
              </Button>
            </div>
          </>
        ) : (
          <Form
            layout="vertical"
            onFinish={(values) => {
              updatePluginAndReload(
                pluginId, 
                values.apiUrl, 
                values.authType === 'bearer' ? values.apiKey : '',  // Changed to bearer
                setShowSuccessAlert,
                values.authType,
                values.authType === 'basic' ? values.username : '',  // Changed to basic
                values.authType === 'basic' ? values.password : ''   // Changed to basic
              );
            }}
            initialValues={{
              apiUrl: state.apiUrl || '',
              authType: state.authType || 'bearer',
              apiKey: '',
              username: state.username || '',
              password: ''
            }}
            onValuesChange={(changedValues, allValues) => {
              // When authType changes, ensure other fields are set correctly
              if (changedValues.authType) {
                const newAuthType = changedValues.authType;
                setAuthType(newAuthType);
                
                // Delay execution to ensure DOM is updated before setting field values
                setTimeout(() => {
                  if (newAuthType === 'basic') {
                    form.setFieldsValue({
                      ...allValues,
                      username: state.username || ''
                    });
                  }
                }, 0);
              }
            }}
            form={form}
          >
            <Form.Item
              name="apiUrl"
              label="Metrics Write Url"
              rules={[{ required: true, message: 'Please input Grafana URL!' }]}
              extra="A url to write predict metrics into storage"
            >
              <Input 
                placeholder="Your Grafana Url Address"
                autoComplete="off"
              />
            </Form.Item>
            
            <Form.Item name="authType" label="Auth Type">
            <Radio.Group 
                value={authType} 
                onChange={(e) => {
                  const newAuthType = e.target.value;
                  setAuthType(newAuthType);
                  
                  // Manually set form field values
                  const currentValues = form.getFieldsValue();
                  const newValues = { ...currentValues, authType: newAuthType };
                  
                  if (newAuthType === 'basic') {
                    newValues.username = state.username || '';
                    newValues.password = '';
                    newValues.apiKey = '';
                  } else {
                    newValues.username = '';
                    newValues.password = '';
                    newValues.apiKey = '';
                  }
                  
                  // Use setTimeout to ensure DOM is updated before setting field values
                  setTimeout(() => {
                    form.setFieldsValue(newValues);
                  }, 0);
                }}
              >
                <Radio.Button value="bearer">Bearer Auth</Radio.Button>  {/* Changed option text */}
                <Radio.Button value="basic">Basic Auth</Radio.Button>    {/* Changed option text */}
              </Radio.Group>
            </Form.Item>
            
            {authType === 'bearer' ? (  // Changed to bearer
              <Form.Item
                name="apiKey"
                label="API Token"
                rules={[{ required: true, message: 'Please input API Token!' }]}
                extra="The token to access the grafana"
              >
                <Input 
                  placeholder="Your Grafana Url Token"
                  data-testid={testIds.appConfig.apiKey}
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please input username!' }]}
                >
                  <Input 
                    placeholder="Grafana user name" 
                    autoComplete="username"  // Added this line to specify correct autocomplete type
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Please input password!' }]}
                >
                  <Input.Password placeholder="Grafana password" 
                  autoComplete="current-password" />
                </Form.Item>
              </>
            )}
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit"
                data-testid={testIds.appConfig.submit}
              >
                Save Metrics Write Settings
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>

      <Modal
        title="Update Metrics Write Settings"
        open={showUpdateModal}
        onCancel={() => setShowUpdateModal(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="apiUrl"
            label="Metrics Write Url"
            rules={[{ required: true, message: 'Please input Grafana URL!' }]}
          >
            <Input placeholder="Please Input Grafana URL" />
          </Form.Item>
          
          <Form.Item name="authType" label="Auth Type">
            <Radio.Group onChange={handleAuthTypeChange} defaultValue={state.authType || 'bearer'}>  {/* Changed default value to bearer */}
              <Radio.Button value="bearer">Bearer Auth</Radio.Button>  {/* Changed option text */}
              <Radio.Button value="basic">Basic Auth</Radio.Button>    {/* Changed option text */}
            </Radio.Group>
          </Form.Item>
          
          {authType === 'bearer' ? (  // Changed to bearer
            <Form.Item
              name="apiKey"
              label="API Token"
              rules={[{ required: true, message: 'Please input API Token!' }]}
            >
              <Input placeholder="Please Input Grafana Token" />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please input username!' }]}
              >
                <Input placeholder="Grafana username" />
              </Form.Item>
              <Form.Item
                name="password"
                label="password"
                rules={[{ required: true, message: 'Please input password!' }]}
              >
                <Input.Password placeholder="Grafana password" />
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default GrafanaWriteSettings;