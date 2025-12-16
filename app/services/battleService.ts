
import { supabase } from '@/app/integrations/supabase/client';

export type BattleFormat = '1v1' | '2v2' | '3v3' | '4v4' | '5v5';

export interface BattleLobby {
  id: string;
  host_id: string;
  format: BattleFormat;
  status: 'waiting' | 'searching' | 'matched' | 'in_battle' | 'completed' | 'cancelled';
  team_a_players: string[];
  team_b_players: string[] | null;
  max_players_per_team: number;
  current_players_count: number;
  match_found_at: string | null;
  battle_started_at: string | null;
  battle_ended_at: string | null;
  return_to_solo_stream: boolean;
  original_stream_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattleInvitation {
  id: string;
  lobby_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  responded_at: string | null;
  expires_at: string;
}

export interface BattleMatch {
  id: string;
  lobby_a_id: string;
  lobby_b_id: string;
  format: BattleFormat;
  stream_id: string | null;
  team_a_score: number;
  team_b_score: number;
  winner_team: 'team_a' | 'team_b' | 'draw' | null;
  status: 'pending_accept' | 'live' | 'completed' | 'cancelled';
  team_a_accepted: string[];
  team_b_accepted: string[];
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

class BattleService {
  /**
   * Create a new battle lobby
   */
  async createLobby(
    userId: string,
    format: BattleFormat,
    returnToSoloStream: boolean = false,
    originalStreamId: string | null = null
  ): Promise<{ lobby: BattleLobby | null; error: Error | null }> {
    try {
      console.log('🎮 Creating battle lobby:', { userId, format, returnToSoloStream });

      const maxPlayersPerTeam = parseInt(format.charAt(0));

      const { data, error } = await supabase
        .from('battle_lobbies')
        .insert({
          host_id: userId,
          format,
          team_a_players: [userId],
          max_players_per_team: maxPlayersPerTeam,
          current_players_count: 1,
          return_to_solo_stream: returnToSoloStream,
          original_stream_id: originalStreamId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating lobby:', error);
        return { lobby: null, error };
      }

      console.log('✅ Lobby created:', data);
      return { lobby: data as BattleLobby, error: null };
    } catch (error) {
      console.error('❌ Exception creating lobby:', error);
      return { lobby: null, error: error as Error };
    }
  }

  /**
   * Send invitation to join a lobby
   */
  async sendInvitation(
    lobbyId: string,
    inviterId: string,
    inviteeId: string
  ): Promise<{ invitation: BattleInvitation | null; error: Error | null }> {
    try {
      console.log('📨 Sending battle invitation:', { lobbyId, inviterId, inviteeId });

      const { data, error } = await supabase
        .from('battle_invitations')
        .insert({
          lobby_id: lobbyId,
          inviter_id: inviterId,
          invitee_id: inviteeId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending invitation:', error);
        return { invitation: null, error };
      }

      // Send real-time notification via Supabase Realtime
      const channel = supabase.channel(`user:${inviteeId}:invitations`);
      await channel.send({
        type: 'broadcast',
        event: 'battle_invitation',
        payload: data,
      });

      console.log('✅ Invitation sent:', data);
      return { invitation: data as BattleInvitation, error: null };
    } catch (error) {
      console.error('❌ Exception sending invitation:', error);
      return { invitation: null, error: error as Error };
    }
  }

  /**
   * Accept a battle invitation
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('✅ Accepting invitation:', { invitationId, userId });

      // Update invitation status
      const { data: invitation, error: inviteError } = await supabase
        .from('battle_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invitee_id', userId)
        .select()
        .single();

      if (inviteError) {
        console.error('❌ Error accepting invitation:', inviteError);
        return { success: false, error: inviteError };
      }

      // Add user to lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select()
        .eq('id', invitation.lobby_id)
        .single();

      if (lobbyError || !lobby) {
        console.error('❌ Error fetching lobby:', lobbyError);
        return { success: false, error: lobbyError || new Error('Lobby not found') };
      }

      const updatedPlayers = [...lobby.team_a_players, userId];
      const { error: updateError } = await supabase
        .from('battle_lobbies')
        .update({
          team_a_players: updatedPlayers,
          current_players_count: updatedPlayers.length,
        })
        .eq('id', invitation.lobby_id);

      if (updateError) {
        console.error('❌ Error updating lobby:', updateError);
        return { success: false, error: updateError };
      }

      console.log('✅ Invitation accepted and user added to lobby');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception accepting invitation:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Decline a battle invitation
   */
  async declineInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('❌ Declining invitation:', { invitationId, userId });

      const { error } = await supabase
        .from('battle_invitations')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invitee_id', userId);

      if (error) {
        console.error('❌ Error declining invitation:', error);
        return { success: false, error };
      }

      console.log('✅ Invitation declined');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception declining invitation:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Enter matchmaking queue
   */
  async enterMatchmaking(lobbyId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('🔍 Entering matchmaking:', { lobbyId });

      // Get lobby details
      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select()
        .eq('id', lobbyId)
        .single();

      if (lobbyError || !lobby) {
        console.error('❌ Error fetching lobby:', lobbyError);
        return { success: false, error: lobbyError || new Error('Lobby not found') };
      }

      // Update lobby status
      const { error: updateError } = await supabase
        .from('battle_lobbies')
        .update({ status: 'searching' })
        .eq('id', lobbyId);

      if (updateError) {
        console.error('❌ Error updating lobby status:', updateError);
        return { success: false, error: updateError };
      }

      // Add to matchmaking queue
      const { error: queueError } = await supabase
        .from('battle_matchmaking_queue')
        .insert({
          lobby_id: lobbyId,
          format: lobby.format,
          players_count: lobby.current_players_count,
        });

      if (queueError) {
        console.error('❌ Error adding to queue:', queueError);
        return { success: false, error: queueError };
      }

      // Try to find a match
      await this.findMatch(lobbyId, lobby.format);

      console.log('✅ Entered matchmaking');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception entering matchmaking:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Find a match for a lobby
   */
  private async findMatch(lobbyId: string, format: BattleFormat): Promise<void> {
    try {
      console.log('🔍 Finding match for lobby:', { lobbyId, format });

      // Find another lobby in queue with same format
      const { data: queueEntries, error } = await supabase
        .from('battle_matchmaking_queue')
        .select('*, battle_lobbies(*)')
        .eq('format', format)
        .neq('lobby_id', lobbyId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error || !queueEntries || queueEntries.length === 0) {
        console.log('⏳ No match found yet, waiting in queue');
        return;
      }

      const opponentLobby = queueEntries[0];

      // Create match
      const { data: match, error: matchError } = await supabase
        .from('battle_matches')
        .insert({
          lobby_a_id: lobbyId,
          lobby_b_id: opponentLobby.lobby_id,
          format,
        })
        .select()
        .single();

      if (matchError) {
        console.error('❌ Error creating match:', matchError);
        return;
      }

      // Update both lobbies
      await supabase
        .from('battle_lobbies')
        .update({ status: 'matched', match_found_at: new Date().toISOString() })
        .in('id', [lobbyId, opponentLobby.lobby_id]);

      // Remove from queue
      await supabase
        .from('battle_matchmaking_queue')
        .delete()
        .in('lobby_id', [lobbyId, opponentLobby.lobby_id]);

      console.log('✅ Match found:', match);
    } catch (error) {
      console.error('❌ Exception finding match:', error);
    }
  }

  /**
   * Accept a battle match
   */
  async acceptMatch(
    matchId: string,
    userId: string,
    lobbyId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('✅ Accepting match:', { matchId, userId, lobbyId });

      // Get match details
      const { data: match, error: matchError } = await supabase
        .from('battle_matches')
        .select()
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        console.error('❌ Error fetching match:', matchError);
        return { success: false, error: matchError || new Error('Match not found') };
      }

      // Determine which team the user is on
      const isTeamA = match.lobby_a_id === lobbyId;
      const acceptedField = isTeamA ? 'team_a_accepted' : 'team_b_accepted';
      const currentAccepted = isTeamA ? match.team_a_accepted : match.team_b_accepted;

      // Add user to accepted list
      const updatedAccepted = [...currentAccepted, userId];

      const { error: updateError } = await supabase
        .from('battle_matches')
        .update({ [acceptedField]: updatedAccepted })
        .eq('id', matchId);

      if (updateError) {
        console.error('❌ Error updating match:', updateError);
        return { success: false, error: updateError };
      }

      // Check if all players have accepted
      await this.checkAllPlayersAccepted(matchId);

      console.log('✅ Match accepted');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception accepting match:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Decline a battle match
   */
  async declineMatch(
    matchId: string,
    userId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('❌ Declining match:', { matchId, userId });

      // Block user from matchmaking for 3 minutes
      await supabase.from('battle_matchmaking_blocks').insert({
        user_id: userId,
        reason: 'declined_match',
        blocked_until: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      });

      // Cancel the match
      await supabase
        .from('battle_matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId);

      // Get match details to find replacement
      const { data: match } = await supabase
        .from('battle_matches')
        .select()
        .eq('id', matchId)
        .single();

      if (match) {
        // Put both lobbies back in queue
        await supabase
          .from('battle_lobbies')
          .update({ status: 'searching' })
          .in('id', [match.lobby_a_id, match.lobby_b_id]);

        // Re-enter matchmaking
        await this.enterMatchmaking(match.lobby_a_id);
        await this.enterMatchmaking(match.lobby_b_id);
      }

      console.log('✅ Match declined and user blocked');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception declining match:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Check if all players have accepted the match
   */
  private async checkAllPlayersAccepted(matchId: string): Promise<void> {
    try {
      const { data: match, error } = await supabase
        .from('battle_matches')
        .select('*, battle_lobbies!lobby_a_id(*), battle_lobbies!lobby_b_id(*)')
        .eq('id', matchId)
        .single();

      if (error || !match) {
        console.error('❌ Error fetching match:', error);
        return;
      }

      // Get both lobbies
      const { data: lobbyA } = await supabase
        .from('battle_lobbies')
        .select()
        .eq('id', match.lobby_a_id)
        .single();

      const { data: lobbyB } = await supabase
        .from('battle_lobbies')
        .select()
        .eq('id', match.lobby_b_id)
        .single();

      if (!lobbyA || !lobbyB) {
        console.error('❌ Error fetching lobbies');
        return;
      }

      const allTeamAAccepted = match.team_a_accepted.length === lobbyA.team_a_players.length;
      const allTeamBAccepted = match.team_b_accepted.length === lobbyB.team_a_players.length;

      if (allTeamAAccepted && allTeamBAccepted) {
        console.log('✅ All players accepted, starting battle');

        // Update match status
        await supabase
          .from('battle_matches')
          .update({
            status: 'live',
            started_at: new Date().toISOString(),
          })
          .eq('id', matchId);

        // Update lobby statuses
        await supabase
          .from('battle_lobbies')
          .update({
            status: 'in_battle',
            battle_started_at: new Date().toISOString(),
          })
          .in('id', [match.lobby_a_id, match.lobby_b_id]);
      }
    } catch (error) {
      console.error('❌ Exception checking players accepted:', error);
    }
  }

  /**
   * Get user's active lobby
   */
  async getUserActiveLobby(userId: string): Promise<{ lobby: BattleLobby | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('battle_lobbies')
        .select()
        .or(`host_id.eq.${userId},team_a_players.cs.{${userId}}`)
        .in('status', ['waiting', 'searching', 'matched', 'in_battle'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching active lobby:', error);
        return { lobby: null, error };
      }

      return { lobby: data as BattleLobby | null, error: null };
    } catch (error) {
      console.error('❌ Exception fetching active lobby:', error);
      return { lobby: null, error: error as Error };
    }
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: string): Promise<{ invitations: BattleInvitation[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('battle_invitations')
        .select('*, battle_lobbies(*), profiles!inviter_id(*)')
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching invitations:', error);
        return { invitations: [], error };
      }

      return { invitations: data as BattleInvitation[], error: null };
    } catch (error) {
      console.error('❌ Exception fetching invitations:', error);
      return { invitations: [], error: error as Error };
    }
  }

  /**
   * Check if user is blocked from matchmaking
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('battle_matchmaking_blocks')
        .select()
        .eq('user_id', userId)
        .gt('blocked_until', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking block status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Exception checking block status:', error);
      return false;
    }
  }

  /**
   * Leave a lobby
   */
  async leaveLobby(lobbyId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      console.log('🚪 Leaving lobby:', { lobbyId, userId });

      const { data: lobby, error: lobbyError } = await supabase
        .from('battle_lobbies')
        .select()
        .eq('id', lobbyId)
        .single();

      if (lobbyError || !lobby) {
        console.error('❌ Error fetching lobby:', lobbyError);
        return { success: false, error: lobbyError || new Error('Lobby not found') };
      }

      // If host is leaving, cancel the lobby
      if (lobby.host_id === userId) {
        await supabase
          .from('battle_lobbies')
          .update({ status: 'cancelled' })
          .eq('id', lobbyId);

        // Remove from queue if in matchmaking
        await supabase
          .from('battle_matchmaking_queue')
          .delete()
          .eq('lobby_id', lobbyId);

        console.log('✅ Lobby cancelled (host left)');
        return { success: true, error: null };
      }

      // Remove user from team
      const updatedPlayers = lobby.team_a_players.filter((id: string) => id !== userId);
      await supabase
        .from('battle_lobbies')
        .update({
          team_a_players: updatedPlayers,
          current_players_count: updatedPlayers.length,
        })
        .eq('id', lobbyId);

      console.log('✅ Left lobby');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ Exception leaving lobby:', error);
      return { success: false, error: error as Error };
    }
  }
}

export const battleService = new BattleService();
