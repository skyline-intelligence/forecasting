import { lastValueFrom } from 'rxjs';
import { getBackendSrv } from '@grafana/runtime';
import { makeHttpRequest } from '../utils/api';
import { MetricsData, DataSourceOption } from '../utils/metrics';

/**
 * Get Grafana data source list
 * @returns List of data source options
 */
export const fetchDataSources = async (): Promise<DataSourceOption[]> => {
  try {
    const response = getBackendSrv().fetch({
      url: 'api/datasources',
      method: 'GET',
    });

    const result = await lastValueFrom(response);
    
    if (result.status >= 400) {
      throw new Error(`Query datasource failed: ${result.statusText}`);
    }

    const sources = result.data || [];
    const options: DataSourceOption[] = sources.map((source: any) => ({
      label: source.name,
      value: source.name,
    }));

    return options;
  } catch (error) {
    console.error('Failed to get datasource list:', error);
    return [];
  }
};

export const deleteMetrics = async (metricsName: string): Promise<void> => {
  try {
    // Build request body
    const requestBody = {
      command: 'delete_metrics',
      metrics_name: metricsName
    };
    
    const data = await makeHttpRequest(requestBody);
    console.error('API response data:', data);
    
  } catch (error) {
    console.error('Failed to delete metrics:', error);
    throw error;
  }
};

export const fetchLicenseData = async (): Promise<{license_type: string; expired_date: string}> => {
  try {
    const requestBody = {
      command: 'query_license'
    };
    
    const data = await makeHttpRequest(requestBody);
    console.log('License data:', data);
    
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  } catch (error) {
    console.error('Failed to get license information:', error);
    throw error;
  }
};

/**
 */
export const fetchMetricsData = async (): Promise<MetricsData[]> => {
  try {
    const requestBody = {
      command: 'query_grafana_metrics'
    };
    
    const data = await makeHttpRequest(requestBody);
    // Add logs to check the returned data structure
    console.error('API response data:', data);

    let processedData = data;
    if (typeof data === 'string') {
      processedData = JSON.parse(data);
  }
    if (processedData && typeof processedData === 'object' && !Array.isArray(processedData) && 
    processedData.metrics_name && processedData.predict_name && processedData.statement && processedData.create_time) {
      
      const length = Object.keys(processedData.metrics_name).length;
      const transformedData: MetricsData[] = [];
      
      for (let i = 0; i < length; i++) {
        transformedData.push({
          key: i.toString(),
          metrics_name: processedData.metrics_name[i],
          predict_name: processedData.predict_name[i],
          statement: processedData.statement[i],
          status: processedData.status[i],
          create_time: new Date(processedData.create_time[i]).toLocaleString() // Convert timestamp to readable format
        });
      }
      
      processedData = transformedData;
    } else if (processedData && !Array.isArray(processedData)) {
      if (typeof processedData === 'object' && processedData !== null) {
        processedData = [processedData]; 
      } else {
        processedData = [];
      }
    }
    
    return Array.isArray(processedData) ? processedData.map((item, index) => ({
      ...item,
      key: item.key || index.toString()
    })) : [];
  } catch (error) {
    console.error('Query data failed:', error);
    return [];
  }
};

/**
 * Add new metrics
 * @param metricsName Metrics name
 * @param statement Query statement
 * @param dataSource Data source
 * @returns API response result
 */
export const addMetrics = async (metricsName: string, statement: string, dataSource: string): Promise<any> => {
  try {
    const requestBody = {
      metrics_name: metricsName,
      statement: statement,
      datasource: dataSource,
      command: 'add_metrics'
    };

    return await makeHttpRequest(requestBody);
  } catch (error) {
    console.error('Failed to add metrics:', error);
    throw error;
  }
};