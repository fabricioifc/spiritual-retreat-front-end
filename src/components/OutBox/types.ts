export type OutboxStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'queued'
  | 'unknown';

export interface OutboxSummary {
  pending: number;
  withErrors: number;
  lastProcessed: string | null;
  oldestPending: string | null;
}

export interface OutboxMessage {
  id: string;
  type: string;
  status: OutboxStatus;
  attempts: number;
  maxAttempts?: number | null;
  processed: boolean;
  createdAt: string;
  processedAt?: string | null;
  lastError?: string | null;
}

export interface OutboxListResponse {
  items: OutboxMessage[];
  total: number;
  page: number;
  pageLimit: number;
}

export interface OutboxHistoryEntry {
  id: string;
  status: OutboxStatus;
  timestamp: string;
  message?: string | null;
}

export interface OutboxDetail extends OutboxMessage {
  payload?: unknown;
  errorStack?: string | null;
  history?: OutboxHistoryEntry[];
}
