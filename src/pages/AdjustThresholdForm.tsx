import React, { useState, useEffect } from 'react';
import { Form, Slider, Button, Spin, DatePicker, Space, Row, Col, Modal, Tooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment';
import { makeHttpRequest } from '../utils/api';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface AdjustThresholdFormProps {
  metricsId: string;
  onCancel: () => void;
  onFinish: () => void;
}

const AdjustThresholdForm: React.FC<AdjustThresholdFormProps> = ({
  metricsId,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());


  // get current threshold
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setIsLoadingChart(true);
        setError(null);
        setChartData([]);
        form.resetFields(); 
        
        const requestBody = {
          command: 'query_threshold',
          metrics_name: metricsId
        };
        
        const data = await makeHttpRequest(requestBody);
        const { upper_threshold, lower_threshold } = data;
        
        // setup table value
        form.setFieldsValue({
          upper_threshold,
          lower_threshold,
        });
      } catch (error) {
        console.error('Failed to get thresholds:', error);
      } finally {
        setIsLoadingChart(false);
      }
    };
    
    fetchThresholds();
  }, [metricsId, form]);

  const handleDateChange = (date: moment.Moment | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSimulate = async () => {
    try {
      const values = await form.validateFields();
      setIsSimulating(true);
      setError(null);

      const requestBody = {
        command: 'threshold_simulate',
        metrics_name: metricsId,
        upper_threshold: values.upper_threshold,
        lower_threshold: values.lower_threshold,
        simulate_date: selectedDate.format('YYYY-MM-DD')
      };
      
      const data = await makeHttpRequest(requestBody);
      let processedData = data;
      if (typeof data === 'string') {
        processedData = JSON.parse(data);
      }
      
      const formattedData = [];
      const dsArray = processedData.ds;
      const actualArray = processedData.actual;
      const forecastingArray = processedData.forecasting;
      
      const timePoints = Array.isArray(dsArray) ? dsArray : Object.values(dsArray);
      const actualValues = Array.isArray(actualArray) ? actualArray : Object.values(actualArray);
      const forecastingValues = Array.isArray(forecastingArray) ? forecastingArray : Object.values(forecastingArray);
      
      for (let i = 0; i < timePoints.length; i++) {
        formattedData.push({
          time: new Date(timePoints[i]),
          actual: parseFloat(actualValues[i]),
          forecasting: parseFloat(forecastingValues[i]),
        });
      }
      
      setChartData(formattedData);
    } catch (error) {
      console.error('Simulation failed:', error);
      setError(`Simulation failed: ${error.message || error}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // 提交阈值修改
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      setError(null);

      const requestBody = {
        command: 'update_threshold',
        metrics_name: metricsId,
        upper_threshold: values.upper_threshold,
        lower_threshold: values.lower_threshold
      };
      
      const parsedData = await makeHttpRequest(requestBody);
      
      Modal.success({
        title: 'Success',
        content: 'Threshold updated successfully',
        okText: 'OK',
      });

      onFinish();
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      setError(`Failed to update thresholds: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <div style={{ marginBottom: 16, height: 300, border: '1px solid #f0f0f0', borderRadius: 4, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <DatePicker 
            value={selectedDate} 
            onChange={handleDateChange} 
            allowClear={false}
            disabledDate={(current) => current && current > moment().endOf('day')}
            defaultValue={moment()}
            picker="date" 
          />
        </div>
        
        {isLoadingChart || isSimulating ? (
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin tip="Loading..." />
          </div>
        ) : chartData.length > 0 ? (
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.map(point => ({
                  time: point.time instanceof Date ? point.time.getTime() : Number(point.time),
                  actual: Number(point.actual),
                  forecasting: Number(point.forecasting)
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
                    return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
                  }}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(timestamp) => {
                    const date = new Date(timestamp);
                    return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
                  }}
                  formatter={(value, name) => {
                    const formattedValue = Number(value).toFixed(2);
                    const displayName = {
                      actual: 'Real Metrics',
                      forecasting: 'Forecast Metrics',
                    }[name as string] || name;
                    return [formattedValue, displayName];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#1890ff" 
                  dot={false} 
                  name="Real Metrics"
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecasting" 
                  stroke="#FF4500" 
                  dot={false} 
                  name="Forecast Metrics"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999' }}>
            {error ? (
              <div style={{ color: '#ff4d4f' }}>{error}</div>
            ) : (
              'Click "Simulate" button to view results'
            )}
          </div>
        )}
      </div>
      
      <Row gutter={16}>
        <Col span={12}>
        <Form.Item
              name="upper_threshold"
              label={
                <span>
                  Upper Threshold{' '}
                  <Tooltip 
                    title={
                      <div style={{ 
                        maxWidth: '600px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'inherit'  
                      }}>
                        {`Use caution when adjusting the upper_threshold and lower_threshold settings.

Widening the acceptable range (by raising the upper_threshold or lowering the lower_threshold) helps prevent false alarms triggered by expected, high-volume traffic volatility. The trade-off is that the system becomes less sensitive, potentially missing critical drops in traffic metrics that indicate an actual outage or failure.

Guidance: Set these values to encompass the normal range of fluctuations observed in your daily metrics. Aim for a balance that minimizes unnecessary alerts ("false positives") while ensuring timely detection of abnormal drops caused by real problems ("true positives").`}
                      </div>
                    }
                    overlayStyle={{ 
                      maxWidth: '600px',
                      color: '#fff'  
                    }}
                  >
                    <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Configure Upper Threshold' }]}
            >
            <Slider
              min={1.00}
              max={1.50}
              step={0.01}
              marks={{
                1.00: '1.00',
                1.10: '1.10',
                1.20: '1.20',
                1.30: '1.30',
                1.40: '1.40',
                1.50: '1.50',
              }}
              tooltip={{ formatter: (value) => value?.toFixed(2) }}
              trackStyle={{ backgroundColor: '#1890ff' }}
              railStyle={{ backgroundColor: '#d9d9d9' }} 
              handleStyle={{ borderColor: '#1890ff' }}  
            />
          </Form.Item>
        </Col>
        <Col span={12}>
        <Form.Item
            name="lower_threshold"
            label={
              <span>
                Lower Threshold{' '}
                <Tooltip 
                    title={
                      <div style={{ 
                        maxWidth: '600px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'inherit'  
                      }}>
                        {`Use caution when adjusting the upper_threshold and lower_threshold settings.

Widening the acceptable range (by raising the upper_threshold or lowering the lower_threshold) helps prevent false alarms triggered by expected, high-volume traffic volatility. The trade-off is that the system becomes less sensitive, potentially missing critical drops in traffic metrics that indicate an actual outage or failure.

Guidance: Set these values to encompass the normal range of fluctuations observed in your daily metrics. Aim for a balance that minimizes unnecessary alerts ("false positives") while ensuring timely detection of abnormal drops caused by real problems ("true positives").`}
                      </div>
                    }
                    overlayStyle={{ 
                      maxWidth: '600px',
                      color: '#fff'  
                    }}
                  >
                  <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: 'Configure Lower Threshold' }]}
          >
            <Slider
              min={0.50}
              max={1.00}
              step={0.01}
              marks={{
                0.50: '0.50',
                0.60: '0.60',
                0.70: '0.70',
                0.80: '0.80',
                0.90: '0.90',
                1.00: '1.00',
              }}
              tooltip={{ formatter: (value) => value?.toFixed(2) }}
              trackStyle={{ backgroundColor: '#d9d9d9' }}
              railStyle={{ backgroundColor: '#1890ff' }} 
              handleStyle={{ borderColor: '#d9d9d9' }}  
              reverse
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item>
        <Space>
          <Button 
            type="primary" 
            onClick={handleSimulate}
            loading={isSimulating}
          >
            Simulate
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Save Threshold
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AdjustThresholdForm;