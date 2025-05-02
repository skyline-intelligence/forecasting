import React, { useState } from 'react';
import { Button, Form, Input, Select, Modal, Spin } from 'antd';
import { DataSourceOption } from '../utils/metrics';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AddMetricsFormProps {
  form: any;
  dataSources: DataSourceOption[];
  isSubmitting: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

const AddMetricsForm: React.FC<AddMetricsFormProps> = ({
  form,
  dataSources,
  isSubmitting,
  onCancel,
  onFinish,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestQuery = async () => {
    try {
      const values = await form.validateFields(['metricsName', 'statement', 'dataSource']);
      
      if (!values.metricsName || !values.statement || !values.dataSource) {
        Modal.warning({
          title: 'Please complete the information',
          content: 'Please select input metric name and input query statement',
        });
        return;
      }
      
      setIsLoadingChart(true);
      setTestError(null);
      
      const now = new Date();
      const end = Math.floor(now.getTime() / 1000);
      const start = end - 6 * 60 * 60;
      
      const datasourceResponse = await lastValueFrom(
        getBackendSrv().fetch({
          url: '/api/datasources',
          method: 'GET',
        })
      );
      
      const datasources = datasourceResponse.data || [];
      const selectedDatasource = datasources.find((ds: any) => ds.name === values.dataSource);
      
      if (!selectedDatasource) {
        throw new Error(`Didn't find datasources: ${values.dataSource}`);
      }
      
      let queryResult;
      if (selectedDatasource.type === 'prometheus') {
        const response = await lastValueFrom(
          getBackendSrv().fetch({
            url: `/api/datasources/proxy/${selectedDatasource.id}/api/v1/query_range`,
            method: 'GET',
            params: {
              query: values.statement,
              start: start,
              end: end,
              step: '1m',
            },
          })
        );
        
        const results = response.data.data.result;
        if (!results || results.length === 0) {
          throw new Error('Query returned empty data');
        }
        
        queryResult = results[0].values.map((point: [number, string]) => ({
          time: new Date(point[0] * 1000),
          value: parseFloat(point[1]),
        }));
      } else {
        throw new Error(`Unsupported datasource type: ${selectedDatasource.type}`);
      }
      
      console.error('Query results:', queryResult);
      setChartData(queryResult);
    } catch (error) {
      console.error('Query results:', error);
      setTestError(`Test query failed: ${error.message || error}`);
      setChartData([]);
    } finally {
      setIsLoadingChart(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <div style={{ marginBottom: 16, height: 300, border: '1px solid #f0f0f0', borderRadius: 4, padding: 16 }}>
        {isLoadingChart ? (
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin tip="Loading..." />
          </div>
        ) : chartData.length > 0 ? (
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.map(point => ({
                  time: point.time instanceof Date ? point.time.getTime() : Number(point.time),
                  value: Number(point.value)
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  scale="time" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                  }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return date.toLocaleString();
                  }}
                  formatter={(value) => [`${value}`, 'Metrics Values']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1890ff" 
                  dot={false} 
                  isAnimationActive={false}
                  name="Metrics Values"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
            {testError ? (
              <div style={{ color: '#ff4d4f' }}>{testError}</div>
            ) : (
              'Click the "Test" button to view the 24-hour data chart'
            )}
          </div>
        )}
      </div>
      
      <Form.Item
        name="dataSource"
        label="Data Source"
        rules={[{ required: true, message: 'Please Select Data Source' }]}
      >
        <Select
          options={dataSources}
          placeholder="Please Select Data Source"
        />
      </Form.Item>
      
      <Form.Item
        name="metricsName"
        label="Metrics Name"
        rules={[{ required: true, message: 'Please input metrics name' }]}
      >
        <Input placeholder="Please input metrics name" />
      </Form.Item>
      
      <Form.Item
        name="statement"
        label="Query Statement"
        rules={[{ required: true, message: 'Please input query statement' }]}
      >
        <Input.TextArea 
          placeholder="Please input query statement"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Submit
        </Button>
        <Button 
          style={{ marginLeft: 8 }} 
          onClick={handleTestQuery}
          loading={isLoadingChart}
        >
          Test
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={onCancel}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddMetricsForm;