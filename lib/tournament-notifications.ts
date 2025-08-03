/**
 * Tournament Notification System
 * 
 * This service handles real-time notifications for tournament updates,
 * including bracket progress, game completions, and phase transitions.
 */

import { createClient } from '@supabase/supabase-js';
import { RealtimeTournamentUpdate } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface TournamentNotification {
  id: string;
  tournamentId: string;
  type: 'game_complete' | 'bracket_update' | 'phase_transition' | 'standings_update' | 'championship';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  read: boolean;
}

export interface NotificationPreferences {
  tournamentId: string;
  userId?: string;
  gameCompletions: boolean;
  bracketUpdates: boolean;
  phaseTransitions: boolean;
  standingsUpdates: boolean;
  championship: boolean;
}

/**
 * Send real-time notification for tournament update
 * 
 * @param tournamentId Tournament ID
 * @param update Real-time tournament update
 * @returns Success status
 */
export async function sendTournamentNotification(
  tournamentId: string,
  update: RealtimeTournamentUpdate
): Promise<boolean> {
  try {
    console.log(`[TournamentNotifications] Sending notification for tournament ${tournamentId}, type: ${update.type}`);

    // Get tournament information
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('[TournamentNotifications] Tournament not found:', tournamentError);
      return false;
    }

    // Create notification based on update type
    const notification = createNotificationFromUpdate(tournamentId, tournament.name, update);

    if (!notification) {
      console.log('[TournamentNotifications] No notification needed for this update type');
      return true;
    }

    // Store notification in database
    const { error: insertError } = await supabase
      .from('tournament_notifications')
      .insert({
        tournament_id: tournamentId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        created_at: notification.createdAt,
        read: false
      });

    if (insertError) {
      console.error('[TournamentNotifications] Error storing notification:', insertError);
      return false;
    }

    // Broadcast notification via real-time
    await broadcastNotification(tournamentId, notification);

    console.log(`[TournamentNotifications] Notification sent: ${notification.title}`);
    return true;

  } catch (error) {
    console.error('[TournamentNotifications] Error sending notification:', error);
    return false;
  }
}

/**
 * Create notification from tournament update
 * 
 * @param tournamentId Tournament ID
 * @param tournamentName Tournament name
 * @param update Real-time tournament update
 * @returns Notification object
 */
function createNotificationFromUpdate(
  tournamentId: string,
  tournamentName: string,
  update: RealtimeTournamentUpdate
): TournamentNotification | null {
  const now = new Date().toISOString();
  const id = `notification-${tournamentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  switch (update.type) {
    case 'game_complete':
      const gameData = update.data as any;
      return {
        id,
        tournamentId,
        type: 'game_complete',
        title: `Game Complete - ${tournamentName}`,
        message: `A tournament game has been completed. Final score: ${gameData.home_score}-${gameData.away_score}`,
        data: {
          gameId: gameData.game_id,
          homeTeamId: gameData.home_team_id,
          awayTeamId: gameData.away_team_id,
          homeScore: gameData.home_score,
          awayScore: gameData.away_score,
          winnerTeamId: gameData.winner_team_id,
          isRoundRobin: gameData.is_round_robin
        },
        priority: 'medium',
        createdAt: now,
        read: false
      };

    case 'bracket_update':
      const bracketData = update.data as any;
      if (bracketData.winner_advanced) {
        return {
          id,
          tournamentId,
          type: 'bracket_update',
          title: `Bracket Update - ${tournamentName}`,
          message: `A team has advanced to the next round of the tournament!`,
          data: {
            updatedMatch: bracketData.updated_match,
            nextMatch: bracketData.next_match
          },
          priority: 'high',
          createdAt: now,
          read: false
        };
      }
      return null;

    case 'phase_transition':
      const phaseData = update.data as any;
      return {
        id,
        tournamentId,
        type: 'phase_transition',
        title: `Tournament Phase Change - ${tournamentName}`,
        message: `Tournament has moved from ${phaseData.from_phase} to ${phaseData.to_phase} phase`,
        data: {
          fromPhase: phaseData.from_phase,
          toPhase: phaseData.to_phase,
          bracketType: phaseData.bracket_type,
          totalRounds: phaseData.total_rounds,
          totalGames: phaseData.total_games
        },
        priority: 'high',
        createdAt: now,
        read: false
      };

    case 'standings_update':
      const standingsData = update.data as any;
      if (standingsData.round_robin_complete) {
        return {
          id,
          tournamentId,
          type: 'standings_update',
          title: `Round Robin Complete - ${tournamentName}`,
          message: `Round robin phase is complete! Bracket phase will begin soon.`,
          data: {
            totalTeams: standingsData.total_teams,
            completedGames: standingsData.completed_games,
            expectedGames: standingsData.expected_games
          },
          priority: 'high',
          createdAt: now,
          read: false
        };
      }
      return null;

    default:
      return null;
  }
}

/**
 * Broadcast notification via real-time
 * 
 * @param tournamentId Tournament ID
 * @param notification Notification to broadcast
 */
async function broadcastNotification(
  tournamentId: string,
  notification: TournamentNotification
): Promise<void> {
  try {
    // Broadcast to tournament channel
    await supabase
      .channel(`tournament:${tournamentId}`)
      .send({
        type: 'broadcast',
        event: 'tournament_notification',
        payload: notification
      });

  } catch (error) {
    console.error('[TournamentNotifications] Error broadcasting notification:', error);
  }
}

/**
 * Send championship notification
 * 
 * @param tournamentId Tournament ID
 * @param winnerTeamId Winner team ID
 * @param winnerTeamName Winner team name
 * @returns Success status
 */
export async function sendChampionshipNotification(
  tournamentId: string,
  winnerTeamId: string,
  winnerTeamName: string
): Promise<boolean> {
  try {
    console.log(`[TournamentNotifications] Sending championship notification for ${winnerTeamName}`);

    // Get tournament information
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('[TournamentNotifications] Tournament not found:', tournamentError);
      return false;
    }

    const notification: TournamentNotification = {
      id: `championship-${tournamentId}-${Date.now()}`,
      tournamentId,
      type: 'championship',
      title: `🏆 Tournament Champion - ${tournament.name}`,
      message: `Congratulations to ${winnerTeamName} for winning the tournament!`,
      data: {
        winnerTeamId,
        winnerTeamName,
        tournamentName: tournament.name
      },
      priority: 'high',
      createdAt: new Date().toISOString(),
      read: false
    };

    // Store notification
    const { error: insertError } = await supabase
      .from('tournament_notifications')
      .insert({
        tournament_id: tournamentId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        created_at: notification.createdAt,
        read: false
      });

    if (insertError) {
      console.error('[TournamentNotifications] Error storing championship notification:', insertError);
      return false;
    }

    // Broadcast notification
    await broadcastNotification(tournamentId, notification);

    console.log(`[TournamentNotifications] Championship notification sent for ${winnerTeamName}`);
    return true;

  } catch (error) {
    console.error('[TournamentNotifications] Error sending championship notification:', error);
    return false;
  }
}

/**
 * Get notifications for a tournament
 * 
 * @param tournamentId Tournament ID
 * @param limit Number of notifications to return
 * @returns Array of notifications
 */
export async function getTournamentNotifications(
  tournamentId: string,
  limit: number = 50
): Promise<TournamentNotification[]> {
  try {
    const { data: notifications, error } = await supabase
      .from('tournament_notifications')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TournamentNotifications] Error fetching notifications:', error);
      return [];
    }

    return notifications || [];

  } catch (error) {
    console.error('[TournamentNotifications] Error getting notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * 
 * @param notificationId Notification ID
 * @returns Success status
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournament_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[TournamentNotifications] Error marking notification as read:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[TournamentNotifications] Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Success status
 */
export async function markAllNotificationsAsRead(tournamentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tournament_notifications')
      .update({ read: true })
      .eq('tournament_id', tournamentId)
      .eq('read', false);

    if (error) {
      console.error('[TournamentNotifications] Error marking all notifications as read:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[TournamentNotifications] Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notification count for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Number of unread notifications
 */
export async function getUnreadNotificationCount(tournamentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('tournament_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('read', false);

    if (error) {
      console.error('[TournamentNotifications] Error getting unread count:', error);
      return 0;
    }

    return count || 0;

  } catch (error) {
    console.error('[TournamentNotifications] Error getting unread count:', error);
    return 0;
  }
}

/**
 * Delete old notifications (cleanup)
 * 
 * @param tournamentId Tournament ID
 * @param daysOld Number of days old to delete
 * @returns Number of notifications deleted
 */
export async function cleanupOldNotifications(
  tournamentId: string,
  daysOld: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data: deletedNotifications, error } = await supabase
      .from('tournament_notifications')
      .delete()
      .eq('tournament_id', tournamentId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[TournamentNotifications] Error cleaning up old notifications:', error);
      return 0;
    }

    const deletedCount = deletedNotifications?.length || 0;
    console.log(`[TournamentNotifications] Cleaned up ${deletedCount} old notifications`);

    return deletedCount;

  } catch (error) {
    console.error('[TournamentNotifications] Error cleaning up old notifications:', error);
    return 0;
  }
}

/**
 * Subscribe to tournament notifications
 * 
 * @param tournamentId Tournament ID
 * @param onNotification Callback for new notifications
 * @returns Unsubscribe function
 */
export function subscribeToTournamentNotifications(
  tournamentId: string,
  onNotification: (notification: TournamentNotification) => void
): () => void {
  const channel = supabase.channel(`tournament-notifications:${tournamentId}`);

  channel
    .on('broadcast', { event: 'tournament_notification' }, (payload) => {
      const notification = payload.payload as TournamentNotification;
      onNotification(notification);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
} 
 
 
