import React, { useState, useEffect } from 'react';
import type { TableColumnsType } from 'antd';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Table, Alert, Flex, Modal, Form, Popconfirm, Tag, Tooltip } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { MetricsData } from '../utils/metrics';
import { useMetricsTableSearch } from './MetricsTableSearch';
import AddMetricsForm from './AddMetricsForm';
import { BusinessError } from '../utils/api';
import AdjustThresholdForm from './AdjustThresholdForm';
import { fetchDataSources, fetchMetricsData, addMetrics, deleteMetrics, fetchLicenseData } from './metricsService';

const PageTwo: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [serverValid, setServerValid] = useState(false);
  
  // Add state
  const [tableData, setTableData] = useState<MetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dataSources, setDataSources] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseData, setLicenseData] = useState<{license_type: string; expired_date: number} | null>(null);
  const [form] = Form.useForm();

  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [selectedMetricsName, setSelectedMetricsName] = useState('');

  const { getColumnSearchProps } = useMetricsTableSearch({
    searchText,
    searchedColumn,
    setSearchText,
    setSearchedColumn,
  });

  useEffect(() => {
    (async () => {
      const valid = await loadServerAddress();
      setServerValid(valid);
      if (valid) {
        await Promise.all([
          loadLicenseData(),
          loadData(),
          loadDataSources()
        ]);
      }
    })();
  }, []);

  const loadServerAddress = async () => {
    const config = await getPluginConfig();
    if (config) {
      const serverAddress = config.forecasting_server
      if (serverAddress === "none") {
        Modal.error({
          title: 'Configuration Required',
          content: 'Please contact your system administrator to configure the server address first',
          okText: 'OK',
          width: 500
        });
        return false;
      } else {
        localStorage.setItem('skyline_backend_url', serverAddress);
        return true;
      }
    } else{
      Modal.error({
        title: 'Configuration Required',
        content: 'Please contact your system administrator to configure the server address first',
        okText: 'OK',
        width: 500
      });
      return false;
    }
  };

  async function getPluginConfig() {
    try {
        const backendSrv = getBackendSrv();
        const response = await backendSrv.get('/api/plugins/skylineintelligence-forecasting-app/resources/config');
        return response;
    } catch (error) {
        console.error('Failed to fetch config:', error);
        return null;
    }
  }

  const loadLicenseData = async () => {
    try {
      const data = await fetchLicenseData();
      setLicenseData(data);
    } catch (error) {
      console.error('Failed to load license data:', error);
    }
  };

  const loadDataSources = async () => {
    const sources = await fetchDataSources();
    setDataSources(sources);
    
    const prometheusSource = sources.find(option => option.value.toLowerCase().includes('prometheus'));
    if (prometheusSource) {
      form.setFieldsValue({ dataSource: prometheusSource.value });
    } else if (sources.length > 0) {
      form.setFieldsValue({ dataSource: sources[0].value });
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMetricsData();
      setTableData(data);
    } catch (error) {
      console.error('Load data failed:', error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (metrics_name: string) => {
    try {
      await deleteMetrics(metrics_name);
      
      // Reload data after successful deletion
      loadData();
      
      Modal.success({
        title: 'Success',
        content: 'Metric deleted successfully',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      Modal.error({
        title: 'Error',
        content: `Delete failed: ${error}`,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      await addMetrics(values.metricsName, values.statement, values.dataSource);

      form.resetFields();
      setShowAddForm(false);
      
      loadData();
      
      Modal.success({
        title: 'Success',
        content: 'Add Metrics Successfully',
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        // Handle business exceptions, display business-related error messages
        Modal.error({
          title: 'Error',
          content: `${error.message}`,
        });
        // Can display more user-friendly error prompts on the UI
      } else {
        // Handle other types of exceptions, such as network errors
        Modal.error({
          title: 'Error',
          content: `Please contact system administrator to configure the server address first`,
        });
        // Can display general error prompts
      }
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleMetricsNameClick = (metricsName: string) => {
    setSelectedMetricsName(metricsName);
    setShowThresholdForm(true);
  };
  
  const handleThresholdFormCancel = () => {
    setShowThresholdForm(false);
    setSelectedMetricsName('');
  };
  
  const handleThresholdFormFinish = () => {
    setShowThresholdForm(false);
    setSelectedMetricsName('');
    loadData();
  };

  const columns: TableColumnsType<MetricsData> = [
    {
      title: 'Metrics Name',
      dataIndex: 'metrics_name',
      key: 'metrics_name',
      width: '20%',
      ...getColumnSearchProps('metrics_name'),
      render: (text) => (
        <a onClick={() => handleMetricsNameClick(text)}>{text}</a>
      ),
    },
    {
      title: 'Predict Name',
      dataIndex: 'predict_name',
      key: 'predict_name',
      width: '20%',
      ...getColumnSearchProps('predict_name'),
    },
    {
      title: 'Statement',
      dataIndex: 'statement',
      key: 'statement',
      width: '40%',
      ...getColumnSearchProps('statement'),
      render: (text) => (
        <div style={{ 
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      showSorterTooltip: false, 
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortDirections: ['descend', 'ascend'],
      render: (status, record) => {
        const statusConfig = {
          running: {
            icon: <CheckCircleOutlined />,
            color: 'success',
            text: 'running'
          },
          initializing: {
            icon: <SyncOutlined spin />,
            color: 'processing',
            text: 'initializing'
          },
          failed: {
            icon: <CloseCircleOutlined />,
            color: 'error',
            text: 'failed'
          }
        };
        
        const config = statusConfig[status] || {
          icon: null,
          color: 'default',
          text: 'unknown'
        };

        if (status === 'failed' && record.failed_message) {
          return (
            <Tooltip title={record.failed_message}
            overlayInnerStyle={{ 
              backgroundColor: '#fafafa', 
              color: '#666',
              border: '1px solid #d9d9d9'
            }}
            >
              <Tag icon={config.icon} color={config.color}>
                {config.text}
              </Tag>
            </Tooltip>
          );
        }
        
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Create Time',
      dataIndex: 'create_time',
      key: 'create_time',
      width: '20%',
      showSorterTooltip: false, 
      ...getColumnSearchProps('create_time'),
      sorter: (a, b) => new Date(a.create_time).getTime() - new Date(b.create_time).getTime(),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this metric?"
          description="This action cannot be undone, please confirm."
          onConfirm={() => handleDelete(record.metrics_name)}
          okText="Confirm"
          cancelText="Cancel"
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
          >
            delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
    {licenseData && licenseData.expired_date < 10 && (
      <Alert
        message="License Warning"
        description={`Your ${licenseData.license_type} license will expire in ${licenseData.expired_date} days. Please renew it in the admin configuration page to ensure uninterrupted prediction services.`}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    )}
    
      <Alert
        message="Note"
        description={
          <>
            <div>1. Add your metrics query below and wait for initialization (variables in the query are not supported)</div>
            <div>2. The statement is an aggregation query for metrics, for example, successful payments per minute: sum(increase(payment_completed_count{'{'}service="pay", test="false{'}'}[1m]))</div>
            <div>3. Once initialized, prediction metrics with the same aggregation as in your statement will be available in Prometheus database with suffix: <strong>{'{your_metrics_name}_predict'}</strong></div>
            <div>4. For best results, include at least 90 days of historical data</div>
          </>
        }
        type="info"
        showIcon
      />
      <br />
      <Flex gap="small" wrap style={{ marginBottom: 16 }}>
      <Button 
          type="primary" 
          onClick={() => setShowAddForm(true)}
          disabled={!serverValid}
        >
          Add new metrics
        </Button>
      </Flex>
      
      <Modal
        title="Add New Predict Metrics"
        open={showAddForm}
        onCancel={() => setShowAddForm(false)}
        footer={null}
        width={700}
      >
        <AddMetricsForm
          form={form}
          dataSources={dataSources}
          isSubmitting={isSubmitting}
          onCancel={() => setShowAddForm(false)}
          onFinish={handleSubmit}
        />
      </Modal>

      {}
      <Modal
        title="Fine Tuning Forecast Threshold"
        open={showThresholdForm}
        onCancel={handleThresholdFormCancel}
        footer={null}
        width={1000}
        height={900}
      >
        <AdjustThresholdForm
          metricsId={selectedMetricsName}
          onCancel={handleThresholdFormCancel}
          onFinish={handleThresholdFormFinish}
        />
      </Modal>
      
      {serverValid && (
        <Table<MetricsData> 
          columns={columns} 
          dataSource={tableData} 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          style={{ width: '100%' }}
        />
      )}
    </>
  );
};

export default PageTwo;