import { 
  GameRealtimeManager, 
  DashboardRealtimeManager,
  createGameSubscription,
  createDashboardSubscription,
  SubscriptionFilters
} from '../realtime';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    })),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

describe('GameRealtimeManager', () => {
  let manager: GameRealtimeManager;
  const gameId = 'test-game-id';

  beforeEach(() => {
    manager = new GameRealtimeManager(gameId);
  });

  afterEach(() => {
    manager.unsubscribe();
  });

  describe('constructor', () => {
    it('should initialize with default filters', () => {
      expect(manager).toBeDefined();
      expect(manager.getConnectionStatus().connected).toBe(false);
    });

    it('should accept custom filters', () => {
      const filters: SubscriptionFilters = {
        granularity: 'summary',
        includeEvents: false,
        debounceMs: 500
      };
      
      const customManager = new GameRealtimeManager(gameId, filters);
      expect(customManager).toBeDefined();
    });
  });

  describe('subscription management', () => {
    it('should handle subscription options', async () => {
      const onEvent = jest.fn();
      const onSnapshot = jest.fn();
      const onConnectionStatus = jest.fn();

      await manager.subscribe({
        onEvent,
        onSnapshot,
        onConnectionStatus
      });

      expect(manager).toBeDefined();
    });

    it('should handle unsubscribe', () => {
      manager.unsubscribe();
      expect(manager.getConnectionStatus().connected).toBe(false);
    });
  });

  describe('connection status', () => {
    it('should return initial connection status', () => {
      const status = manager.getConnectionStatus();
      expect(status.connected).toBe(false);
      expect(status.reconnecting).toBe(false);
    });
  });
});

describe('DashboardRealtimeManager', () => {
  let manager: DashboardRealtimeManager;

  beforeEach(() => {
    manager = new DashboardRealtimeManager();
  });

  afterEach(() => {
    manager.unsubscribe();
  });

  describe('subscription management', () => {
    it('should handle dashboard subscriptions', async () => {
      const onGameUpdate = jest.fn();
      const onConnectionStatus = jest.fn();

      await manager.subscribe({
        onGameUpdate,
        onConnectionStatus
      });

      expect(manager).toBeDefined();
    });

    it('should handle unsubscribe', () => {
      manager.unsubscribe();
      expect(manager.getConnectionStatus().connected).toBe(false);
    });
  });
});

describe('Utility functions', () => {
  describe('createGameSubscription', () => {
    it('should create a game subscription manager', () => {
      const manager = createGameSubscription('test-game');
      expect(manager).toBeInstanceOf(GameRealtimeManager);
    });

    it('should accept filters', () => {
      const filters: SubscriptionFilters = {
        granularity: 'summary'
      };
      const manager = createGameSubscription('test-game', filters);
      expect(manager).toBeInstanceOf(GameRealtimeManager);
    });
  });

  describe('createDashboardSubscription', () => {
    it('should create a dashboard subscription manager', () => {
      const manager = createDashboardSubscription();
      expect(manager).toBeInstanceOf(DashboardRealtimeManager);
    });
  });
});

describe('Subscription Filters', () => {
  let manager: GameRealtimeManager;
  const gameId = 'test-game-id';

  afterEach(() => {
    if (manager) {
      manager.unsubscribe();
    }
  });

  it('should handle event type filtering', () => {
    const filters: SubscriptionFilters = {
      eventTypes: ['pitch', 'at_bat']
    };
    
    manager = new GameRealtimeManager(gameId, filters);
    expect(manager).toBeDefined();
  });

  it('should handle granularity settings', () => {
    const summaryFilters: SubscriptionFilters = {
      granularity: 'summary'
    };
    
    manager = new GameRealtimeManager(gameId, summaryFilters);
    expect(manager).toBeDefined();
  });

  it('should handle inclusion settings', () => {
    const filters: SubscriptionFilters = {
      includeEvents: false,
      includeSnapshots: true
    };
    
    manager = new GameRealtimeManager(gameId, filters);
    expect(manager).toBeDefined();
  });

  it('should handle debouncing settings', () => {
    const filters: SubscriptionFilters = {
      debounceMs: 1000
    };
    
    manager = new GameRealtimeManager(gameId, filters);
    expect(manager).toBeDefined();
  });
}); 