
import { supabase } from '@/app/integrations/supabase/client';
import { inboxService } from './inboxService';
import { escalationService } from './escalationService';
import { pushNotificationService } from './pushNotificationService';

export interface ClassificationScores {
  toxicity: number;
  harassment: number;
  hateSpeech: number;
  sexualContent: number;
  threat: number;
  spam: number;
  overall: number;
}

export interface UserViolation {
  id: string;
  user_id: string;
  flagged_text: string;
  toxicity_score: number;
  harassment_score: number;
  hate_speech_score: number;
  sexual_content_score: number;
  threat_score: number;
  spam_score: number;
  overall_score: number;
  action_taken: 'flagged' | 'hidden' | 'timeout' | 'blocked';
  stream_id?: string;
  post_id?: string;
  story_id?: string;
  message_id?: string;
  hidden_from_others?: boolean;
  created_at: string;
}

export interface AIStrike {
  id: string;
  user_id: string;
  creator_id: string;
  strike_level: 1 | 2 | 3 | 4;
  type: string;
  reason: string;
  issued_by_ai: boolean;
  expires_at: string | null;
  created_at: string;
}

class AIModerationService {
  /**
   * Classify message content using AI (simulated for now)
   * In production, this would call OpenAI Moderation API or similar
   * 
   * Example OpenAI integration:
   * const response = await fetch('https://api.openai.com/v1/moderations', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'Authorization': `Bearer ${OPENAI_API_KEY}`
   *   },
   *   body: JSON.stringify({ input: message })
   * });
   */
  private async classifyMessage(message: string): Promise<ClassificationScores> {
    // TODO: Replace with actual AI API call (OpenAI Moderation API, Perspective API, etc.)
    // For now, using keyword-based detection as placeholder
    
    const lowerMessage = message.toLowerCase();
    
    // Simulate AI scores (0.0 to 1.0)
    const scores: ClassificationScores = {
      toxicity: this.detectToxicity(lowerMessage),
      harassment: this.detectHarassment(lowerMessage),
      hateSpeech: this.detectHateSpeech(lowerMessage),
      sexualContent: this.detectSexualContent(lowerMessage),
      threat: this.detectThreat(lowerMessage),
      spam: this.detectSpam(lowerMessage),
      overall: 0,
    };

    // Calculate overall score (weighted average)
    scores.overall = (
      scores.toxicity * 0.2 +
      scores.harassment * 0.2 +
      scores.hateSpeech * 0.25 +
      scores.sexualContent * 0.15 +
      scores.threat * 0.15 +
      scores.spam * 0.05
    );

    return scores;
  }

  // Placeholder detection methods (replace with AI API)
  private detectToxicity(text: string): number {
    const toxicWords = ['stupid', 'idiot', 'dumb', 'loser', 'trash', 'pathetic', 'worthless'];
    const count = toxicWords.filter(word => text.includes(word)).length;
    return Math.min(count * 0.3, 0.95);
  }

  private detectHarassment(text: string): number {
    const harassmentWords = ['kill yourself', 'kys', 'die', 'hurt yourself', 'end it'];
    const count = harassmentWords.filter(word => text.includes(word)).length;
    return count > 0 ? 0.9 : 0.1;
  }

  private detectHateSpeech(text: string): number {
    const hateWords = ['n word', 'f word', 'slur', 'racist', 'bigot'];
    const count = hateWords.filter(word => text.includes(word)).length;
    return count > 0 ? 0.95 : 0.1;
  }

  private detectSexualContent(text: string): number {
    const sexualWords = ['explicit', 'nsfw', 'porn', 'nude', 'sex'];
    const count = sexualWords.filter(word => text.includes(word)).length;
    return Math.min(count * 0.35, 0.9);
  }

  private detectThreat(text: string): number {
    const threatWords = ['bomb', 'attack', 'shoot', 'kill you', 'hurt you', 'find you'];
    const count = threatWords.filter(word => text.includes(word)).length;
    return count > 0 ? 0.9 : 0.1;
  }

  private detectSpam(text: string): number {
    // Check for repeated characters or excessive caps
    const hasRepeatedChars = /(.)\1{5,}/.test(text);
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    const hasLinks = /https?:\/\//.test(text);
    
    let score = 0;
    if (hasRepeatedChars) score += 0.3;
    if (capsRatio > 0.7) score += 0.3;
    if (hasLinks) score += 0.2;
    
    return Math.min(score, 0.9);
  }

  /**
   * Determine category based on scores
   */
  private determineCategory(scores: ClassificationScores): string {
    const categories = [
      { name: 'hate_speech', score: scores.hateSpeech },
      { name: 'harassment', score: scores.harassment },
      { name: 'threat', score: scores.threat },
      { name: 'sexual_content', score: scores.sexualContent },
      { name: 'toxicity', score: scores.toxicity },
      { name: 'spam', score: scores.spam },
    ];

    categories.sort((a, b) => b.score - a.score);
    return categories[0].name;
  }

  /**
   * PROMPT 1: Real-Time Chat Moderation with Escalation
   * PROMPT 2: Push Notifications for AI & Moderator Actions
   * 
   * Moderate a message and take appropriate action based on score
   * 
   * Threshold actions:
   * - Score < 0.30 → allow message
   * - Score ≥ 0.30 → flag silently
   * - Score ≥ 0.50 → hide message from everyone except sender + SEND PUSH
   * - Score ≥ 0.60 but < 0.85 → ESCALATE TO MODERATOR
   * - Score ≥ 0.70 → auto timeout user for 2 minutes + SEND PUSH
   * - Score ≥ 0.85 → block user from current stream
   */
  async moderateMessage(
    userId: string,
    message: string,
    streamId?: string,
    postId?: string,
    storyId?: string,
    messageId?: string
  ): Promise<{
    allowed: boolean;
    action: 'allow' | 'flag' | 'hide' | 'timeout' | 'block' | 'escalate';
    scores: ClassificationScores;
    hiddenFromOthers?: boolean;
  }> {
    try {
      const scores = await this.classifyMessage(message);

      let action: 'allow' | 'flag' | 'hide' | 'timeout' | 'block' | 'escalate' = 'allow';
      let actionTaken: 'flagged' | 'hidden' | 'timeout' | 'blocked' | null = null;
      let hiddenFromOthers = false;

      // Score < 0.30 → allow message
      if (scores.overall < 0.30) {
        action = 'allow';
      }
      // Score ≥ 0.30 → flag silently
      else if (scores.overall >= 0.30 && scores.overall < 0.50) {
        action = 'flag';
        actionTaken = 'flagged';
      }
      // Score ≥ 0.50 → hide message from everyone except sender + SEND PUSH
      else if (scores.overall >= 0.50 && scores.overall < 0.60) {
        action = 'hide';
        actionTaken = 'hidden';
        hiddenFromOthers = true;
        
        // PROMPT 2: Send push notification
        await pushNotificationService.sendPushNotification(
          userId,
          'MODERATION_WARNING',
          'Your message was moderated',
          'One of your messages was hidden for breaking the rules.',
          { stream_id: streamId, post_id: postId, story_id: storyId }
        );
      }
      // Score ≥ 0.60 but < 0.85 → ESCALATE TO MODERATOR
      else if (scores.overall >= 0.60 && scores.overall < 0.85) {
        action = 'escalate';
        actionTaken = 'hidden';
        hiddenFromOthers = true;

        // Record violation first
        const { data: violation } = await supabase.from('user_violations').insert({
          user_id: userId,
          flagged_text: message,
          toxicity_score: scores.toxicity,
          harassment_score: scores.harassment,
          hate_speech_score: scores.hateSpeech,
          sexual_content_score: scores.sexualContent,
          threat_score: scores.threat,
          spam_score: scores.spam,
          overall_score: scores.overall,
          action_taken: actionTaken,
          stream_id: streamId || null,
          post_id: postId || null,
          story_id: storyId || null,
          message_id: messageId || null,
          hidden_from_others: hiddenFromOthers,
        }).select().single();

        if (violation) {
          // Escalate to moderator
          const sourceType = streamId ? 'live' : (postId ? 'comment' : 'inboxMessage');
          const category = this.determineCategory(scores);
          
          await escalationService.escalateToModerator(
            violation.id,
            userId,
            sourceType,
            message.substring(0, 200), // Preview
            scores.overall,
            category,
            streamId
          );
        }

        await inboxService.sendMessage(
          userId,
          userId,
          'Your message has been flagged for moderator review.',
          'safety'
        );
      }
      // Score ≥ 0.70 → auto timeout user for 2 minutes + SEND PUSH
      else if (scores.overall >= 0.70 && scores.overall < 0.85) {
        action = 'timeout';
        actionTaken = 'timeout';
        hiddenFromOthers = true;
        
        // Apply 2-minute timeout
        if (streamId) {
          await this.applyTimeout(userId, streamId, 2);
        }
        
        // PROMPT 2: Send push notification
        await pushNotificationService.sendPushNotification(
          userId,
          'TIMEOUT_APPLIED',
          'You\'ve been timed out',
          'You cannot participate in chat for 2 minutes due to rule violations.',
          { stream_id: streamId, duration_minutes: 2 }
        );
      }
      // Score ≥ 0.85 → block user from current stream + SEND PUSH
      else if (scores.overall >= 0.85) {
        action = 'block';
        actionTaken = 'blocked';
        hiddenFromOthers = true;
        
        // Block from stream
        if (streamId) {
          await this.blockFromStream(userId, streamId);
        }
        
        // PROMPT 2: Send push notification
        await pushNotificationService.sendPushNotification(
          userId,
          'BAN_APPLIED',
          'You were banned from a livestream',
          'You can no longer join this creator\'s lives due to repeated violations.',
          { stream_id: streamId }
        );
      }

      // Record violation if action was taken
      if (actionTaken && action !== 'escalate') {
        await supabase.from('user_violations').insert({
          user_id: userId,
          flagged_text: message,
          toxicity_score: scores.toxicity,
          harassment_score: scores.harassment,
          hate_speech_score: scores.hateSpeech,
          sexual_content_score: scores.sexualContent,
          threat_score: scores.threat,
          spam_score: scores.spam,
          overall_score: scores.overall,
          action_taken: actionTaken,
          stream_id: streamId || null,
          post_id: postId || null,
          story_id: storyId || null,
          message_id: messageId || null,
          hidden_from_others: hiddenFromOthers,
        });

        console.log(`🤖 AI Moderation: ${action} - Score: ${scores.overall.toFixed(2)}`);
      }

      return {
        allowed: action === 'allow' || action === 'flag',
        action,
        scores,
        hiddenFromOthers,
      };
    } catch (error) {
      console.error('Error in moderateMessage:', error);
      // Fail open - allow message if moderation fails
      return {
        allowed: true,
        action: 'allow',
        scores: {
          toxicity: 0,
          harassment: 0,
          hateSpeech: 0,
          sexualContent: 0,
          threat: 0,
          spam: 0,
          overall: 0,
        },
      };
    }
  }

  /**
   * PROMPT 2: AI Pre-Check of Usernames & Bios
   * 
   * Detect:
   * - offensive language
   * - threats
   * - impersonation words ("official", "admin", "support")
   * - sexual terms
   * - slurs
   * 
   * If score >= 0.60: username rejected
   * If score >= 0.80: auto report into moderation table
   */
  async validateUsername(
    userId: string,
    username: string,
    bio?: string
  ): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    try {
      const textToCheck = bio ? `${username} ${bio}` : username;
      const scores = await this.classifyMessage(textToCheck);

      // Check for impersonation words
      const impersonationWords = ['official', 'admin', 'support', 'staff', 'moderator', 'roastlive', 'verified'];
      const hasImpersonation = impersonationWords.some(word => 
        username.toLowerCase().includes(word)
      );

      const finalScore = hasImpersonation ? Math.max(scores.overall, 0.65) : scores.overall;

      // If score >= 0.60: username rejected
      if (finalScore >= 0.60) {
        // If score >= 0.80: auto report into moderation table
        const autoReported = finalScore >= 0.80;

        await supabase.from('username_moderation_log').insert({
          user_id: userId,
          attempted_username: username,
          attempted_bio: bio || null,
          rejection_reason: hasImpersonation 
            ? 'Contains impersonation words' 
            : 'Contains offensive content',
          overall_score: finalScore,
          auto_reported: autoReported,
        });

        console.log(`🤖 Username rejected: ${username} - Score: ${finalScore.toFixed(2)}`);

        return {
          allowed: false,
          message: 'This name is restricted. Please choose another.',
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error in validateUsername:', error);
      // Fail open
      return { allowed: true };
    }
  }

  /**
   * PROMPT 3: AI Violation Strike System (3-Tier)
   * 
   * Strike levels:
   * 1º strike → Warning
   * 2º strike → Auto timeout 10 minutes
   * 3º strike → Stream-ban for next 24 hours
   * 4º strike (within 1 month) → Permanent ban from that creator's stream
   * 
   * DO NOT global-ban across platform.
   * Strike resets every 30 days unless violation was severe.
   */
  async applyStrike(
    userId: string,
    creatorId: string,
    type: string,
    reason: string
  ): Promise<void> {
    try {
      // Get existing strikes for this user with this creator in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: existingStrikes } = await supabase
        .from('ai_strikes')
        .select('*')
        .eq('user_id', userId)
        .eq('creator_id', creatorId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const strikeCount = (existingStrikes?.length || 0) + 1;
      let strikeLevel: 1 | 2 | 3 | 4 = Math.min(strikeCount, 4) as 1 | 2 | 3 | 4;
      let action = '';
      let expiresAt: Date | null = null;

      // Determine action based on strike level
      switch (strikeLevel) {
        case 1:
          action = 'Warning issued';
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          break;
        case 2:
          action = 'Timeout active';
          // Apply 10-minute timeout
          await this.applyTimeout(userId, null, 10, creatorId);
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          break;
        case 3:
          action = 'Streaming ban applied';
          expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          break;
        case 4:
          action = 'Permanent ban from that creator\'s stream';
          expiresAt = null; // Permanent
          break;
      }

      // Insert strike
      await supabase.from('ai_strikes').insert({
        user_id: userId,
        creator_id: creatorId,
        strike_level: strikeLevel,
        type,
        reason,
        issued_by_ai: true,
        expires_at: expiresAt?.toISOString() || null,
      });

      // Send inbox notification
      await inboxService.sendMessage(
        userId,
        userId,
        `Account Action Notice: ${action}. Reason: ${reason}`,
        'safety'
      );

      console.log(`🤖 Strike ${strikeLevel} applied to user ${userId}`);
    } catch (error) {
      console.error('Error in applyStrike:', error);
    }
  }

  /**
   * Get active strikes for a user with a specific creator
   */
  async getActiveStrikes(userId: string, creatorId: string): Promise<AIStrike[]> {
    try {
      const { data, error } = await supabase
        .from('ai_strikes')
        .select('*')
        .eq('user_id', userId)
        .eq('creator_id', creatorId)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active strikes:', error);
        return [];
      }

      return data as AIStrike[];
    } catch (error) {
      console.error('Error in getActiveStrikes:', error);
      return [];
    }
  }

  /**
   * Check if user is banned from a creator's streams
   */
  async isUserBannedFromCreator(userId: string, creatorId: string): Promise<boolean> {
    try {
      const strikes = await this.getActiveStrikes(userId, creatorId);
      
      // Check for level 4 strike (permanent ban) or level 3 within 24 hours
      const hasPermanentBan = strikes.some(s => s.strike_level === 4);
      const hasActiveBan = strikes.some(s => 
        s.strike_level === 3 && 
        s.expires_at && 
        new Date(s.expires_at) > new Date()
      );

      return hasPermanentBan || hasActiveBan;
    } catch (error) {
      console.error('Error in isUserBannedFromCreator:', error);
      return false;
    }
  }

  /**
   * PROMPT 4: AI Audio & Camera Monitoring (light version)
   * 
   * During livestream, run lightweight passive content classification.
   * AI monitors:
   * - loud profanity detection
   * - violent actions
   * - hate speech audio patterns
   * 
   * Triggers: Show ONLY to host: "This livestream content may violate rules."
   * Do NOT: stop stream, interrupt broadcast, modify tokens, flag Cloudflare sessions
   * This mode only generates warnings and logs.
   */
  async logStreamWarning(
    streamId: string,
    riskScore: number,
    detectedCategory: 'profanity' | 'violence' | 'hate_speech'
  ): Promise<void> {
    try {
      await supabase.from('ai_stream_warnings').insert({
        stream_id: streamId,
        risk_score: riskScore,
        detected_category: detectedCategory,
      });

      console.log(`⚠️ Stream warning logged: ${detectedCategory} - Score: ${riskScore.toFixed(2)}`);
    } catch (error) {
      console.error('Error in logStreamWarning:', error);
    }
  }

  /**
   * Get stream warnings for a specific stream
   */
  async getStreamWarnings(streamId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_stream_warnings')
        .select('*')
        .eq('stream_id', streamId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching stream warnings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStreamWarnings:', error);
      return [];
    }
  }

  /**
   * Helper: Apply timeout to user
   */
  private async applyTimeout(
    userId: string, 
    streamId: string | null, 
    durationMinutes: number,
    creatorId?: string
  ): Promise<void> {
    try {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Use timed_out_users_v2 for AI moderation timeouts
      await supabase.from('timed_out_users_v2').insert({
        user_id: userId,
        stream_id: streamId,
        creator_id: creatorId || null,
        duration_minutes: durationMinutes,
        reason: 'AI moderation - content violation',
        end_time: endTime.toISOString(),
      });

      console.log(`⏱️ User ${userId} timed out for ${durationMinutes} minutes`);
    } catch (error) {
      console.error('Error applying timeout:', error);
    }
  }

  /**
   * Helper: Block user from stream
   */
  private async blockFromStream(userId: string, streamId: string): Promise<void> {
    try {
      // Get stream owner
      const { data: stream } = await supabase
        .from('streams')
        .select('broadcaster_id')
        .eq('id', streamId)
        .single();

      if (stream) {
        await supabase.from('banned_viewers').insert({
          banned_user_id: userId,
          stream_owner_id: stream.broadcaster_id,
          reason: 'AI moderation - severe violation',
        });

        console.log(`🚫 User ${userId} blocked from stream ${streamId}`);
      }
    } catch (error) {
      console.error('Error blocking from stream:', error);
    }
  }

  /**
   * Get all violations for admin review
   */
  async getAllViolations(limit: number = 100): Promise<UserViolation[]> {
    try {
      const { data, error } = await supabase
        .from('user_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching violations:', error);
        return [];
      }

      return data as UserViolation[];
    } catch (error) {
      console.error('Error in getAllViolations:', error);
      return [];
    }
  }

  /**
   * Get violations with user profile data
   */
  async getViolationsWithProfiles(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_violations')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching violations with profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getViolationsWithProfiles:', error);
      return [];
    }
  }

  /**
   * Delete a violation (admin action)
   */
  async deleteViolation(violationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_violations')
        .delete()
        .eq('id', violationId);

      if (error) {
        console.error('Error deleting violation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteViolation:', error);
      return { success: false, error: 'Failed to delete violation' };
    }
  }

  /**
   * Remove a strike (admin action)
   */
  async removeStrike(strikeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_strikes')
        .delete()
        .eq('id', strikeId);

      if (error) {
        console.error('Error removing strike:', error);
        return { success: false, error: error.message };
      }

      // Notify user
      await inboxService.sendMessage(
        userId,
        userId,
        'A strike has been removed from your account by an administrator.',
        'safety'
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error in removeStrike:', error);
      return { success: false, error: 'Failed to remove strike' };
    }
  }

  /**
   * Get trending violation categories
   */
  async getTrendingViolations(): Promise<Record<string, number>> {
    try {
      const data = await this.getAllViolations(500);
      
      const categoryCount: Record<string, number> = {};
      data.forEach((violation) => {
        categoryCount[violation.action_taken] = (categoryCount[violation.action_taken] || 0) + 1;
      });

      return categoryCount;
    } catch (error) {
      console.error('Error in getTrendingViolations:', error);
      return {};
    }
  }

  /**
   * Get repeat offenders
   */
  async getRepeatOffenders(minViolations: number = 3): Promise<{ userId: string; count: number }[]> {
    try {
      const data = await this.getAllViolations(1000);
      
      const userViolationCount: Record<string, number> = {};
      data.forEach((violation) => {
        userViolationCount[violation.user_id] = (userViolationCount[violation.user_id] || 0) + 1;
      });

      return Object.entries(userViolationCount)
        .filter(([, count]) => count >= minViolations)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error in getRepeatOffenders:', error);
      return [];
    }
  }

  /**
   * Get most reported users
   */
  async getMostReportedUsers(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_violations')
        .select('user_id, profiles:user_id(username, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error || !data) return [];

      // Count violations per user
      const userCounts: Record<string, { count: number; profile: any }> = {};
      data.forEach((v: any) => {
        if (!userCounts[v.user_id]) {
          userCounts[v.user_id] = { count: 0, profile: v.profiles };
        }
        userCounts[v.user_id].count++;
      });

      // Sort and return top users
      return Object.entries(userCounts)
        .map(([userId, { count, profile }]) => ({ userId, count, profile }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getMostReportedUsers:', error);
      return [];
    }
  }
}

export const aiModerationService = new AIModerationService();