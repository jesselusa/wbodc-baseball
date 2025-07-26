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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY!;

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

// Global connection registry to prevent channel name collisions
const connectionRegistry = new Map<string, GameRealtimeManager>();

// Game-specific realtime subscription manager
export class GameRealtimeManager {
  private gameId: string;
  private instanceId: string; // Unique instance identifier
  private channel: RealtimeChannel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private filters: SubscriptionFilters;
  private isDisposed = false; // Flag to prevent operations after disposal
  
  // Event handlers
  private onEventHandler?: (update: RealtimeGameUpdate) => void;
  private onSnapshotHandler?: (snapshot: GameSnapshot) => void;
  private onConnectionStatusHandler?: (status: ConnectionStatus) => void;
  
  // Debouncing for rapid updates
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdates: RealtimeGameUpdate[] = [];

  constructor(gameId: string, filters: SubscriptionFilters = {}) {
    this.gameId = gameId;
    this.instanceId = `${gameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.filters = {
      granularity: 'full',
      includeSnapshots: true,
      includeEvents: true,
      debounceMs: 0,
      ...filters
    };
    
    console.log(`[GameRealtimeManager] Created instance ${this.instanceId} for game ${gameId}`);
  }

  /**
   * Subscribe to real-time updates for a specific game
   */
  async subscribe(options: GameSubscriptionOptions): Promise<void> {
    if (this.isDisposed) {
      console.warn(`[GameRealtimeManager] Attempted to subscribe to disposed instance ${this.instanceId}`);
      return;
    }
    
    console.log(`[GameRealtimeManager] Subscribing instance ${this.instanceId} to game: ${this.gameId}`);
    
    // Check if another instance is already connected to this game
    const existingInstance = connectionRegistry.get(this.gameId);
    if (existingInstance && existingInstance !== this && !existingInstance.isDisposed) {
      console.warn(`[GameRealtimeManager] Another instance already connected to game ${this.gameId}, cleaning it up first`);
      await existingInstance.dispose();
      // Add a small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Register this instance
    connectionRegistry.set(this.gameId, this);
    
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
    if (this.isDisposed) {
      console.warn(`[GameRealtimeManager] Attempted to connect disposed instance ${this.instanceId}`);
      return;
    }
    
    try {
      console.log(`[GameRealtimeManager] Instance ${this.instanceId} connecting to game channel: game:${this.gameId}`);
      
      // Clean up existing channel if it exists
      if (this.channel) {
        console.log(`[GameRealtimeManager] Cleaning up existing channel before reconnect for instance ${this.instanceId}`);
        this.channel.unsubscribe();
        this.channel = null;
      }
      
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
        console.log(`[GameRealtimeManager] Instance ${this.instanceId} channel status: ${status}`);
        this.isConnected = status === 'SUBSCRIBED';
        
        // Don't handle status changes for disposed instances
        if (this.isDisposed) {
          console.log(`[GameRealtimeManager] Ignoring status ${status} for disposed instance ${this.instanceId}`);
          return;
        }
        
        if (status === 'SUBSCRIBED') {
          console.log(`[GameRealtimeManager] Instance ${this.instanceId} successfully connected to game:${this.gameId}`);
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
          console.error(`[GameRealtimeManager] Instance ${this.instanceId} connection failed with status: ${status}`);
          this.isConnected = false;
          this.notifyConnectionStatus({
            connected: false,
            reconnecting: false,
            error: `Connection ${status.toLowerCase()}`
          });
          
          // Only attempt reconnection if not disposed
          if (!this.isDisposed) {
            this.scheduleReconnect();
          }
        } else if (status === 'CLOSED') {
          console.warn(`[GameRealtimeManager] Instance ${this.instanceId} connection closed for game:${this.gameId}`);
          this.isConnected = false;
          
          // Check if this is an intentional closure (due to navigation/cleanup)
          if (this.isDisposed || connectionRegistry.get(this.gameId) !== this) {
            console.log(`[GameRealtimeManager] Instance ${this.instanceId} connection closed intentionally, not reconnecting`);
            this.notifyConnectionStatus({
              connected: false,
              reconnecting: false,
              error: 'Connection closed'
            });
          } else {
            console.warn(`[GameRealtimeManager] Instance ${this.instanceId} connection closed unexpectedly, attempting reconnect...`);
            this.notifyConnectionStatus({
              connected: false,
              reconnecting: true,
              error: 'Connection closed'
            });
            
            // Attempt reconnection for unexpected closures
            this.scheduleReconnect();
          }
        } else {
          console.log(`[GameRealtimeManager] Instance ${this.instanceId} intermediate status: ${status}`);
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
      created_at: event.created_at,
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
      // First, get the game status to determine expected behavior
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('status')
        .eq('id', this.gameId)
        .single();

      if (gameError || !game) {
        console.error('Error fetching game status:', gameError);
        return;
      }

      // Handle snapshots based on game status
      const query = supabase
        .from('game_snapshots')
        .select('*')
        .eq('game_id', this.gameId);

      let result;
      if (game.status === 'active') {
        // Active games MUST have snapshots - error if missing
        result = await query.single();
      } else {
        // Scheduled/other games MAY have snapshots - null if missing
        result = await query.maybeSingle();
      }

      const { data: snapshot, error } = result;

      if (error) {
        console.error('Error fetching latest snapshot:', error);
        return;
      }

      if (snapshot) {
        this.handleSnapshotUpdate(snapshot);
      }
      // For scheduled games without snapshots, this is normal
    } catch (error) {
      console.error('Error in fetchLatestSnapshot:', error);
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isDisposed) {
      console.log(`[GameRealtimeManager] Not scheduling reconnect for disposed instance ${this.instanceId}`);
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`[GameRealtimeManager] Instance ${this.instanceId} max reconnection attempts reached`);
      this.notifyConnectionStatus({
        connected: false,
        reconnecting: false,
        error: 'Max reconnection attempts reached'
      });
      return;
    }

    console.log(`[GameRealtimeManager] Instance ${this.instanceId} scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${this.reconnectDelay}ms`);
    this.notifyConnectionStatus({
      connected: false,
      reconnecting: true
    });

    this.debounceTimer = setTimeout(async () => {
      // Double-check disposed state after timeout
      if (this.isDisposed) {
        console.log(`[GameRealtimeManager] Instance ${this.instanceId} disposed during reconnect timeout, aborting`);
        return;
      }
      
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
   * Dispose of this manager instance completely
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    
    console.log(`[GameRealtimeManager] Disposing instance ${this.instanceId} for game: ${this.gameId}`);
    this.isDisposed = true;
    
    // Remove from registry if this instance is registered
    if (connectionRegistry.get(this.gameId) === this) {
      connectionRegistry.delete(this.gameId);
    }
    
    if (this.channel) {
      try {
        // Wait for unsubscribe to complete
        await new Promise<void>((resolve) => {
          this.channel!.unsubscribe();
          // Give Supabase time to process the unsubscribe
          setTimeout(resolve, 100);
        });
      } catch (error) {
        console.warn(`[GameRealtimeManager] Error during channel unsubscribe for instance ${this.instanceId}:`, error);
      }
      this.channel = null;
    }
    
    this.isConnected = false;
    
    // Clear any pending reconnection attempts
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Reset connection state
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    
    // Clear handlers
    this.onEventHandler = undefined;
    this.onSnapshotHandler = undefined;
    this.onConnectionStatusHandler = undefined;
  }

  /**
   * Unsubscribe from the game channel (legacy method, use dispose instead)
   */
  unsubscribe(): void {
    // Use dispose for proper cleanup
    this.dispose().catch(error => {
      console.warn(`[GameRealtimeManager] Error during dispose from unsubscribe:`, error);
    });
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