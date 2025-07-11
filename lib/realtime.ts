import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { 
  RealtimeGameUpdate, 
  RealtimeDashboardUpdate,
  GameSnapshot,
  GameEvent,
  LiveGameStatus
} from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Connection status types
export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  reconnecting: boolean;
  lastConnected?: Date;
}

// Channel subscription types
export type ChannelSubscription = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

// Subscription filtering options
export interface SubscriptionFilters {
  eventTypes?: string[]; // Filter to specific event types
  granularity?: 'full' | 'summary'; // Full events or summary data only
  includeSnapshots?: boolean; // Whether to include snapshot updates
  includeEvents?: boolean; // Whether to include individual events
  debounceMs?: number; // Debounce rapid updates
}

// Enhanced subscription options
export interface GameSubscriptionOptions {
  onEvent?: (update: RealtimeGameUpdate) => void;
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onConnectionStatus?: (status: ConnectionStatus) => void;
  filters?: SubscriptionFilters;
}

// Game-specific realtime subscription manager
export class GameRealtimeManager {
  private gameId: string;
  private channel: RealtimeChannel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private filters: SubscriptionFilters;
  
  // Event handlers
  private onEventHandler?: (update: RealtimeGameUpdate) => void;
  private onSnapshotHandler?: (snapshot: GameSnapshot) => void;
  private onConnectionStatusHandler?: (status: ConnectionStatus) => void;
  
  // Debouncing for rapid updates
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingUpdates: RealtimeGameUpdate[] = [];

  constructor(gameId: string, filters: SubscriptionFilters = {}) {
    this.gameId = gameId;
    this.filters = {
      granularity: 'full',
      includeSnapshots: true,
      includeEvents: true,
      debounceMs: 0,
      ...filters
    };
  }

  /**
   * Subscribe to real-time updates for a specific game
   */
  async subscribe(options: GameSubscriptionOptions): Promise<void> {
    this.onEventHandler = options.onEvent;
    this.onSnapshotHandler = options.onSnapshot;
    this.onConnectionStatusHandler = options.onConnectionStatus;
    
    // Merge filters from options
    if (options.filters) {
      this.filters = { ...this.filters, ...options.filters };
    }

    await this.connect();
  }

  /**
   * Connect to the game channel
   */
  private async connect(): Promise<void> {
    try {
      console.log(`[Realtime] Attempting to connect to game channel: game:${this.gameId}`);
      
      // Create channel for this specific game
      this.channel = supabase.channel(`game:${this.gameId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: this.gameId }
        }
      });

      console.log(`[Realtime] Channel created, setting up subscriptions...`);

      // Subscribe to game events (if enabled)
      if (this.filters.includeEvents) {
        console.log(`[Realtime] Setting up game_events subscription for game ${this.gameId}`);
        this.channel.on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'game_events',
            filter: `game_id=eq.${this.gameId}`
          }, 
          (payload) => {
            console.log(`[Realtime] Received game event:`, payload);
            const event = payload.new as GameEvent;
            this.handleEventUpdate(event);
          }
        );
      }

      // Subscribe to snapshot changes (if enabled)
      if (this.filters.includeSnapshots) {
        console.log(`[Realtime] Setting up game_snapshots subscription for game ${this.gameId}`);
        this.channel
          .on('postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'game_snapshots',
              filter: `game_id=eq.${this.gameId}`
            },
            (payload) => {
              console.log(`[Realtime] Received snapshot update:`, payload);
              const snapshot = payload.new as GameSnapshot;
              this.handleSnapshotUpdate(snapshot);
            }
          )
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'game_snapshots',
              filter: `game_id=eq.${this.gameId}`
            },
            (payload) => {
              console.log(`[Realtime] Received snapshot insert:`, payload);
              const snapshot = payload.new as GameSnapshot;
              this.handleSnapshotUpdate(snapshot);
            }
          );
      }

      console.log(`[Realtime] Subscriptions configured, attempting to subscribe...`);

      // Handle connection status changes
      this.channel.subscribe((status) => {
        console.log(`[Realtime] Channel status changed to: ${status}`);
        this.isConnected = status === 'SUBSCRIBED';
        
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully connected to game:${this.gameId}`);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifyConnectionStatus({
            connected: true,
            reconnecting: false,
            lastConnected: new Date()
          });
          
          // Fetch latest snapshot on successful connection
          this.fetchLatestSnapshot();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Realtime] Connection failed with status: ${status}`);
          this.isConnected = false;
          this.notifyConnectionStatus({
            connected: false,
            reconnecting: false,
            error: `Connection ${status.toLowerCase()}`
          });
          
          // Attempt reconnection
          this.scheduleReconnect();
        } else if (status === 'CLOSED') {
          console.warn(`[Realtime] Connection closed for game:${this.gameId}`);
          this.isConnected = false;
          this.notifyConnectionStatus({
            connected: false,
            reconnecting: false,
            error: 'Connection closed'
          });
        } else {
          console.log(`[Realtime] Intermediate status: ${status}`);
        }
      });

    } catch (error) {
      console.error('[Realtime] Error connecting to game channel:', error);
      this.notifyConnectionStatus({
        connected: false,
        reconnecting: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      });
    }
  }

  /**
   * Handle new game events with filtering
   */
  private handleEventUpdate(event: GameEvent): void {
    // Apply event type filtering
    if (this.filters.eventTypes && !this.filters.eventTypes.includes(event.type)) {
      return;
    }

    // Create update based on granularity setting
    const update: RealtimeGameUpdate = {
      type: 'event',
      data: this.filters.granularity === 'summary' ? this.createEventSummary(event) as GameEvent : event,
      timestamp: new Date().toISOString()
    };

    // Apply debouncing if configured
    if (this.filters.debounceMs && this.filters.debounceMs > 0) {
      this.debounceUpdate(update);
    } else {
      this.onEventHandler?.(update);
    }
  }

  /**
   * Create a summary version of an event for reduced bandwidth
   */
  private createEventSummary(event: GameEvent): Partial<GameEvent> {
    return {
      id: event.id,
      game_id: event.game_id,
      type: event.type,
      timestamp: event.timestamp,
      sequence_number: event.sequence_number
      // Exclude full payload for summary
    };
  }

  /**
   * Handle debounced updates
   */
  private debounceUpdate(update: RealtimeGameUpdate): void {
    this.pendingUpdates.push(update);
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      // Send the most recent update of each type
      const latestUpdates = new Map<string, RealtimeGameUpdate>();
      
      this.pendingUpdates.forEach(update => {
        const key = update.type === 'event' ? 
          `event-${(update.data as GameEvent).type}` : 
          update.type;
        latestUpdates.set(key, update);
      });
      
      // Send all latest updates
      latestUpdates.forEach(update => {
        this.onEventHandler?.(update);
      });
      
      // Clear pending updates
      this.pendingUpdates = [];
      this.debounceTimer = null;
    }, this.filters.debounceMs);
  }

  /**
   * Handle game snapshot updates
   */
  private handleSnapshotUpdate(snapshot: GameSnapshot): void {
    this.onSnapshotHandler?.(snapshot);
  }

  /**
   * Fetch the latest game snapshot (used on reconnect)
   */
  private async fetchLatestSnapshot(): Promise<void> {
    try {
      const { data: snapshot, error } = await supabase
        .from('game_snapshots')
        .select('*')
        .eq('game_id', this.gameId)
        .single();

      if (error) {
        console.error('Error fetching latest snapshot:', error);
        return;
      }

      if (snapshot) {
        this.handleSnapshotUpdate(snapshot);
      }
    } catch (error) {
      console.error('Error in fetchLatestSnapshot:', error);
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyConnectionStatus({
        connected: false,
        reconnecting: false,
        error: 'Max reconnection attempts reached'
      });
      return;
    }

    this.notifyConnectionStatus({
      connected: false,
      reconnecting: true
    });

    setTimeout(async () => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2, 
        this.maxReconnectDelay
      );
      
      await this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Notify connection status changes
   */
  private notifyConnectionStatus(status: ConnectionStatus): void {
    this.onConnectionStatusHandler?.(status);
  }

  /**
   * Unsubscribe from the game channel
   */
  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.isConnected = false;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      reconnecting: this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts
    };
  }
}

// Dashboard realtime subscription manager
export class DashboardRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private isConnected = false;
  
  // Event handlers
  private onGameUpdateHandler?: (update: RealtimeDashboardUpdate) => void;
  private onConnectionStatusHandler?: (status: ConnectionStatus) => void;

  /**
   * Subscribe to dashboard-level updates (all games summary)
   */
  async subscribe(options: {
    onGameUpdate?: (update: RealtimeDashboardUpdate) => void;
    onConnectionStatus?: (status: ConnectionStatus) => void;
  }): Promise<void> {
    this.onGameUpdateHandler = options.onGameUpdate;
    this.onConnectionStatusHandler = options.onConnectionStatus;

    await this.connect();
  }

  /**
   * Connect to the dashboard channel
   */
  private async connect(): Promise<void> {
    try {
      this.channel = supabase.channel('dashboard', {
        config: {
          broadcast: { self: false }
        }
      });

      // Subscribe to game snapshot changes for dashboard updates
      this.channel
        .on('postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'game_snapshots'
          },
          (payload) => {
            this.handleGameSnapshotChange(payload);
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games'
          },
          (payload) => {
            this.handleGameStatusChange(payload);
          }
        );

      this.channel.subscribe((status) => {
        this.isConnected = status === 'SUBSCRIBED';
        
        this.onConnectionStatusHandler?.({
          connected: this.isConnected,
          reconnecting: false,
          lastConnected: this.isConnected ? new Date() : undefined
        });
      });

    } catch (error) {
      console.error('Error connecting to dashboard channel:', error);
      this.onConnectionStatusHandler?.({
        connected: false,
        reconnecting: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      });
    }
  }

  /**
   * Handle game snapshot changes for dashboard
   */
  private handleGameSnapshotChange(payload: any): void {
    const snapshot = payload.new as GameSnapshot;
    
    // Create a dashboard update with relevant summary information
    const update: RealtimeDashboardUpdate = {
      type: 'game_summary',
      game_id: snapshot.game_id,
      data: {
        game_id: snapshot.game_id,
        current_inning: snapshot.current_inning,
        is_top_of_inning: snapshot.is_top_of_inning,
        outs: snapshot.outs,
        balls: snapshot.balls,
        strikes: snapshot.strikes,
        score_home: snapshot.score_home,
        score_away: snapshot.score_away,
        status: snapshot.status,
        last_updated: snapshot.last_updated
      } as Partial<LiveGameStatus>,
      timestamp: new Date().toISOString()
    };

    this.onGameUpdateHandler?.(update);
  }

  /**
   * Handle game status changes
   */
  private handleGameStatusChange(payload: any): void {
    const game = payload.new;
    
    const update: RealtimeDashboardUpdate = {
      type: 'game_status_change',
      game_id: game.id,
      data: {
        game_id: game.id,
        // Include relevant game status information
      } as Partial<LiveGameStatus>,
      timestamp: new Date().toISOString()
    };

    this.onGameUpdateHandler?.(update);
  }

  /**
   * Unsubscribe from the dashboard channel
   */
  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.isConnected = false;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      reconnecting: false
    };
  }
}

// Utility functions for subscription management

/**
 * Create a game-specific realtime subscription
 */
export function createGameSubscription(gameId: string, filters: SubscriptionFilters = {}): GameRealtimeManager {
  return new GameRealtimeManager(gameId, filters);
}

/**
 * Create a dashboard realtime subscription
 */
export function createDashboardSubscription(): DashboardRealtimeManager {
  return new DashboardRealtimeManager();
}

/**
 * Get live game status with team/player names
 */
export async function getLiveGameStatus(gameId: string): Promise<LiveGameStatus | null> {
  try {
    const { data, error } = await supabase
      .from('live_game_status')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error fetching live game status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLiveGameStatus:', error);
    return null;
  }
}

/**
 * Get current game snapshot
 */
export async function getGameSnapshot(gameId: string): Promise<GameSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('game_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game snapshot:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getGameSnapshot:', error);
    return null;
  }
}

/**
 * Get recent game events
 */
export async function getRecentGameEvents(gameId: string, limit: number = 10): Promise<GameEvent[]> {
  try {
    const { data, error } = await supabase
      .from('game_events')
      .select('*')
      .eq('game_id', gameId)
      .order('sequence_number', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent game events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentGameEvents:', error);
    return [];
  }
} 

/**
 * Test realtime connection by creating a simple channel
 * This helps debug connection issues
 */
export async function testRealtimeConnection(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    console.log('[Realtime Test] Starting connection test...');
    
    const testChannel = supabase.channel('connection-test', {
      config: {
        broadcast: { self: false }
      }
    });

    const timeout = setTimeout(() => {
      testChannel.unsubscribe();
      resolve({ success: false, error: 'Connection test timed out after 10 seconds' });
    }, 10000);

    testChannel.subscribe((status) => {
      console.log(`[Realtime Test] Status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        testChannel.unsubscribe();
        console.log('[Realtime Test] Connection successful!');
        resolve({ success: true });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        testChannel.unsubscribe();
        console.error(`[Realtime Test] Connection failed: ${status}`);
        resolve({ success: false, error: `Connection failed: ${status}` });
      }
    });
  });
} 