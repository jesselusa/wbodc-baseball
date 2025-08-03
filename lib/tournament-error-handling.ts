/**
 * Tournament Error Handling and Retry System
 * 
 * This service provides comprehensive error handling and retry logic
 * for tournament real-time updates, including exponential backoff,
 * circuit breakers, and error recovery mechanisms.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  halfOpenMaxAttempts: number;
}

export interface ErrorContext {
  tournamentId: string;
  operation: string;
  timestamp: string;
  error: Error;
  attempt: number;
  maxAttempts: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalTime: number;
}

// Default configurations
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  halfOpenMaxAttempts: 3
};

// Circuit breaker states
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Circuit breaker instance
class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;
  private halfOpenAttempts = 0;

  constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.config = config;
  }

  canExecute(): boolean {
    switch (this.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.state = 'HALF_OPEN';
          this.halfOpenAttempts = 0;
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return this.halfOpenAttempts < this.config.halfOpenMaxAttempts;
    }
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.halfOpenAttempts = 0;
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// Global circuit breakers for different operations
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create circuit breaker for an operation
 * 
 * @param operation Operation name
 * @param config Circuit breaker configuration
 * @returns Circuit breaker instance
 */
function getCircuitBreaker(operation: string, config?: CircuitBreakerConfig): CircuitBreaker {
  if (!circuitBreakers.has(operation)) {
    circuitBreakers.set(operation, new CircuitBreaker(config));
  }
  return circuitBreakers.get(operation)!;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 * 
 * @param attempt Current attempt number
 * @param config Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    // Add jitter (±25% of the delay)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    delay += jitter;
  }

  return Math.max(0, delay);
}

/**
 * Execute function with retry logic
 * 
 * @param operation Function to execute
 * @param context Error context
 * @param config Retry configuration
 * @returns Retry result
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: Omit<ErrorContext, 'attempt' | 'maxAttempts'>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[ErrorHandling] Attempt ${attempt}/${config.maxAttempts} for ${context.operation} in tournament ${context.tournamentId}`);

      const result = await operation();
      
      console.log(`[ErrorHandling] Success on attempt ${attempt} for ${context.operation}`);
      
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[ErrorHandling] Attempt ${attempt} failed for ${context.operation}:`, lastError.message);

      // Log error context
      const errorContext: ErrorContext = {
        ...context,
        attempt,
        maxAttempts: config.maxAttempts,
        error: lastError
      };

      await logError(errorContext);

      // Check if we should retry
      if (attempt === config.maxAttempts) {
        console.error(`[ErrorHandling] All ${config.maxAttempts} attempts failed for ${context.operation}`);
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        console.log(`[ErrorHandling] Non-retryable error for ${context.operation}, not retrying`);
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      console.log(`[ErrorHandling] Waiting ${delay}ms before retry for ${context.operation}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts: config.maxAttempts,
    totalTime: Date.now() - startTime
  };
}

/**
 * Execute function with circuit breaker
 * 
 * @param operation Function to execute
 * @param operationName Operation name for circuit breaker
 * @param context Error context
 * @param config Circuit breaker configuration
 * @returns Retry result
 */
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Omit<ErrorContext, 'attempt' | 'maxAttempts'>,
  config?: CircuitBreakerConfig
): Promise<RetryResult<T>> {
  const circuitBreaker = getCircuitBreaker(operationName, config);

  if (!circuitBreaker.canExecute()) {
    console.warn(`[ErrorHandling] Circuit breaker OPEN for ${operationName}, skipping execution`);
    return {
      success: false,
      error: `Circuit breaker is OPEN for ${operationName}`,
      attempts: 0,
      totalTime: 0
    };
  }

  try {
    const result = await operation();
    circuitBreaker.onSuccess();
    
    return {
      success: true,
      data: result,
      attempts: 1,
      totalTime: 0
    };

  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    circuitBreaker.onFailure();

    console.error(`[ErrorHandling] Circuit breaker failure for ${operationName}:`, lastError.message);

    // Log error context
    const errorContext: ErrorContext = {
      ...context,
      attempt: 1,
      maxAttempts: 1,
      error: lastError
    };

    await logError(errorContext);

    return {
      success: false,
      error: lastError.message,
      attempts: 1,
      totalTime: 0
    };
  }
}

/**
 * Execute function with both retry and circuit breaker
 * 
 * @param operation Function to execute
 * @param operationName Operation name for circuit breaker
 * @param context Error context
 * @param retryConfig Retry configuration
 * @param circuitBreakerConfig Circuit breaker configuration
 * @returns Retry result
 */
export async function executeWithRetryAndCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Omit<ErrorContext, 'attempt' | 'maxAttempts'>,
  retryConfig?: RetryConfig,
  circuitBreakerConfig?: CircuitBreakerConfig
): Promise<RetryResult<T>> {
  const circuitBreaker = getCircuitBreaker(operationName, circuitBreakerConfig);

  if (!circuitBreaker.canExecute()) {
    console.warn(`[ErrorHandling] Circuit breaker OPEN for ${operationName}, skipping execution`);
    return {
      success: false,
      error: `Circuit breaker is OPEN for ${operationName}`,
      attempts: 0,
      totalTime: 0
    };
  }

  const result = await executeWithRetry(operation, context, retryConfig);

  if (result.success) {
    circuitBreaker.onSuccess();
  } else {
    circuitBreaker.onFailure();
  }

  return result;
}

/**
 * Check if an error is retryable
 * 
 * @param error Error to check
 * @returns True if error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Network errors are generally retryable
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return true;
  }

  // Supabase specific errors
  if (error.message.includes('network') || 
      error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }

  // HTTP 5xx errors are retryable
  if (error.message.includes('500') || 
      error.message.includes('502') || 
      error.message.includes('503') || 
      error.message.includes('504')) {
    return true;
  }

  // Authentication errors are not retryable
  if (error.message.includes('401') || error.message.includes('403')) {
    return false;
  }

  // Validation errors are not retryable
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

/**
 * Log error for monitoring and debugging
 * 
 * @param context Error context
 */
async function logError(context: ErrorContext): Promise<void> {
  try {
    // Store error in database for monitoring
    const { error: insertError } = await supabase
      .from('tournament_errors')
      .insert({
        tournament_id: context.tournamentId,
        operation: context.operation,
        error_message: context.error.message,
        error_stack: context.error.stack,
        attempt: context.attempt,
        max_attempts: context.maxAttempts,
        timestamp: context.timestamp
      });

    if (insertError) {
      console.error('[ErrorHandling] Failed to log error to database:', insertError);
    }

  } catch (error) {
    console.error('[ErrorHandling] Failed to log error:', error);
  }
}

/**
 * Get error statistics for a tournament
 * 
 * @param tournamentId Tournament ID
 * @param days Number of days to look back
 * @returns Error statistics
 */
export async function getErrorStatistics(
  tournamentId: string,
  days: number = 7
): Promise<{
  totalErrors: number;
  errorsByOperation: Record<string, number>;
  errorsByType: Record<string, number>;
  averageAttempts: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: errors, error } = await supabase
      .from('tournament_errors')
      .select('*')
      .eq('tournament_id', tournamentId)
      .gte('timestamp', cutoffDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error || !errors) {
      console.error('[ErrorHandling] Error fetching error statistics:', error);
      return {
        totalErrors: 0,
        errorsByOperation: {},
        errorsByType: {},
        averageAttempts: 0
      };
    }

    const errorsByOperation: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};
    let totalAttempts = 0;

    errors.forEach(error => {
      // Count by operation
      errorsByOperation[error.operation] = (errorsByOperation[error.operation] || 0) + 1;
      
      // Count by error type (extract from error message)
      const errorType = extractErrorType(error.error_message);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      
      totalAttempts += error.attempt;
    });

    return {
      totalErrors: errors.length,
      errorsByOperation,
      errorsByType,
      averageAttempts: errors.length > 0 ? totalAttempts / errors.length : 0
    };

  } catch (error) {
    console.error('[ErrorHandling] Error getting error statistics:', error);
    return {
      totalErrors: 0,
      errorsByOperation: {},
      errorsByType: {},
      averageAttempts: 0
    };
  }
}

/**
 * Extract error type from error message
 * 
 * @param errorMessage Error message
 * @returns Error type
 */
function extractErrorType(errorMessage: string): string {
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'NetworkError';
  }
  if (errorMessage.includes('timeout')) {
    return 'TimeoutError';
  }
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return 'AuthenticationError';
  }
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'ValidationError';
  }
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
    return 'ServerError';
  }
  return 'UnknownError';
}

/**
 * Reset circuit breaker for an operation
 * 
 * @param operationName Operation name
 */
export function resetCircuitBreaker(operationName: string): void {
  if (circuitBreakers.has(operationName)) {
    circuitBreakers.delete(operationName);
    console.log(`[ErrorHandling] Reset circuit breaker for ${operationName}`);
  }
}

/**
 * Get circuit breaker status for all operations
 * 
 * @returns Circuit breaker status
 */
export function getCircuitBreakerStatus(): Record<string, {
  state: CircuitBreakerState;
  failureCount: number;
}> {
  const status: Record<string, { state: CircuitBreakerState; failureCount: number }> = {};
  
  circuitBreakers.forEach((breaker, operation) => {
    status[operation] = {
      state: breaker.getState(),
      failureCount: breaker.getFailureCount()
    };
  });

  return status;
}

/**
 * Clean up old error logs
 * 
 * @param daysOld Number of days old to delete
 * @returns Number of logs deleted
 */
export async function cleanupErrorLogs(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data: deletedLogs, error } = await supabase
      .from('tournament_errors')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[ErrorHandling] Error cleaning up error logs:', error);
      return 0;
    }

    const deletedCount = deletedLogs?.length || 0;
    console.log(`[ErrorHandling] Cleaned up ${deletedCount} old error logs`);

    return deletedCount;

  } catch (error) {
    console.error('[ErrorHandling] Error cleaning up error logs:', error);
    return 0;
  }
} 
 
 
