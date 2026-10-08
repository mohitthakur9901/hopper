export type Decision = 'PASS' | 'HOLD' | 'REJECT';
export type Status = 'CREATED' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  createdAt?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type Detection = {
  id: string;
  mediaId: string;
  media_id?: string;
  category: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  severity: Severity;
};

export type Media = {
  id: string;
  type: 'image' | 'video';
  originalUrl: string;
  original_url?: string;
  annotatedUrl?: string;
  annotated_url?: string;
  detections?: Detection[];
};

export type Inspection = {
  id: string;
  stationId: string;
  station_id?: string;
  status: Status;
  decision?: Decision;
  contaminationScore?: number;
  contamination_score?: number;
  processingTimeMs?: number;
  processing_time_ms?: number;
  createdAt: string;
  created_at?: string;
  completedAt?: string;
  completed_at?: string;
  media: Media[];
  detections?: Detection[];
};

export type Station = {
  id: string;
  name: string;
  address?: string;
};

export type DashboardStats = {
  totalInspections: number;
  total_inspections?: number;
  passCount: number;
  pass_count?: number;
  holdCount: number;
  hold_count?: number;
  rejectCount: number;
  reject_count?: number;
  contaminationRate: number; // e.g. 0.15 for 15%
  contamination_rate?: number;
};
