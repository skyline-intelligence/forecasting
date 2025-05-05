export interface MetricsData {
    key?: string;
    metrics_name: string;
    predict_name: string;
    statement: string;
    status: string;
    failed_message: string;
    create_time: string;
  }
  
  export interface DataSourceOption {
    label: string;
    value: string;
  }
  
  export type DataIndex = keyof MetricsData;