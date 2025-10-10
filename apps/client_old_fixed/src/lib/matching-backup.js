import { supabase } from './supabase';
import { isSupabaseConfigured } from './env';

export class MatchingService {
  
  // Static set to track active matching attempts
  static activeMatches = new Set();
  
  // Clear active match for a user (useful for cleanup)
  static clearActiveMatch(userId) {
    this.activeMatches.delete(userId);
  }
  
  // Find random user for matching
  static async findMatch(userId, preferences = {}) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }
    
    // Prevent concurrent matching for the same user
    if (this.activeMatches.has(userId)) {
      throw new Error('Matching already in progress for this user');
    }
    
    // Add user to active matches
    this.activeMatches.add(userId);
    
    try {
      // Get current user info
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !currentUser) {
        throw new Error('User not found');
      }

      // Build query for finding potential matches
      let query = supabase
        .from('users')
        .select('*')
        .eq('is_online', true)
        .neq('id', userId); // Exclude self

      // Apply filters based on user type and preferences
      if (currentUser.is_premium) {
        // Premium users can filter by country and gender
        if (preferences.country) {
          query = query.eq('country', preferences.country);
          console.log('Applied country filter:', preferences.country);
        }
        if (preferences.gender) {
          query = query.eq('gender', preferences.gender);
          console.log('Applied gender filter:', preferences.gender);
        }
        if (preferences.ageRange) {
          query = query.gte('age', preferences.ageRange.min);
          query = query.lte('age', preferences.ageRange.max);
          console.log('Applied age filter:', preferences.ageRange);
        }
      } else {
        // Free users get soft preferences (India preferred, same gender preferred)
        query = query.or(`country.eq.${currentUser.country},country.eq.India`);
        query = query.or(`gender.eq.${currentUser.gender},gender.neq.${currentUser.gender}`);
        console.log('Applied free user filters for country and gender preferences');
      }

      // Exclude users we've recently matched with
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(50);

      if (recentMatches && recentMatches.length > 0) {
        const excludeIds = recentMatches.map(match => 
          match.user1_id === userId ? match.user2_id : match.user1_id
        );
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      // Get potential matches
      const { data: potentialMatches, error: matchError } = await query
        .limit(20);

      if (matchError) {
        console.error('Query error:', matchError);
        throw matchError;
      }

      console.log(`Found ${potentialMatches?.length || 0} potential matches`);

      if (!potentialMatches || potentialMatches.length === 0) {
        console.log('No matches found - not charging tokens');
        return null; // No matches found - don't charge tokens
      }

      // Select random partner
      const randomIndex = Math.floor(Math.random() * potentialMatches.length);
      const partnerData = potentialMatches[randomIndex];

      console.log(`Selected random partner: ${partnerData.name} (${partnerData.id})`);

      // Calculate token deduction (but don't deduct yet - only after successful match creation)
      let tokensDeducted = 0;
      
      // Debug logging
      console.log('Token deduction check:', {
        isPremium: currentUser.is_premium,
        hasCountryFilter: !!preferences.country,
        hasGenderFilter: !!preferences.gender,
        countryValue: preferences.country,
        genderValue: preferences.gender,
        currentTokens: currentUser.tokens
      });
      
      // FIXED: Tokens are only deducted for premium users when they ACTIVELY use premium filtering
      // Don't charge for empty/null preferences - only charge when user explicitly chooses filters
      const isUsingCountryFilter = currentUser.is_premium && preferences.country && preferences.country.trim() !== '';
      const isUsingGenderFilter = currentUser.is_premium && preferences.gender && preferences.gender.trim() !== '';
      
      if (isUsingCountryFilter || isUsingGenderFilter) {
        tokensDeducted = 8;
        
        console.log('Token deduction will be triggered after successful match:', {
          tokensDeducted,
          reason: isUsingCountryFilter ? 'country filter' : 'gender filter',
          countryFilter: preferences.country,
          genderFilter: preferences.gender
        });
        
        // Check if user has enough tokens BEFORE proceeding
        if (currentUser.tokens < tokensDeducted) {
          throw new Error('Insufficient tokens for premium match');
        }
      } else {
        console.log('No token deduction - free matching used:', {
          isPremium: currentUser.is_premium,
          reason: !currentUser.is_premium ? 'free user' : 'no active filters'
        });
      }

      // Create match record
      const { data: matchData, error: createMatchError } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: partnerData.id,
          status: 'active',
          tokens_deducted: tokensDeducted,
        })
        .select('id')
        .single();

      if (createMatchError) {
        console.error('Failed to create match record:', createMatchError);
        throw createMatchError;
      }

      console.log(`Successfully created match record: ${matchData.id}`);

      // ONLY deduct tokens after successful match creation
      if (tokensDeducted > 0) {
        console.log(`Proceeding with token deduction: ${tokensDeducted} tokens`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ tokens: currentUser.tokens - tokensDeducted })
          .eq('id', userId)
          .eq('tokens', currentUser.tokens); // Ensure tokens haven't changed meanwhile

        if (updateError) {
          console.error('Token deduction failed:', updateError);
          // Don't throw error here - match was created successfully
          // Just log the error and continue
        } else {
          console.log(`Successfully deducted ${tokensDeducted} tokens`);

          // Record transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              type: 'deduction',
              amount_inr: (tokensDeducted / 1.5), // Convert tokens back to INR
              tokens: -tokensDeducted,
              description: 'Premium filtering token deduction',
              status: 'completed',
            });
        }
      }

      // Update user's total calls
      await supabase
        .from('users')
        .update({ total_calls: currentUser.total_calls + 1 })
        .eq('id', userId);

      const partner = {
        id: partnerData.id,
        email: partnerData.email,
        name: partnerData.name,
        age: partnerData.age,
        country: partnerData.country,
        gender: partnerData.gender,
        avatarUrl: partnerData.avatar_url,
        isPremium: partnerData.is_premium,
        tokens: partnerData.tokens,
        subscriptionExpiresAt: partnerData.subscription_expires_at,
        isOnline: partnerData.is_online,
        lastSeen: partnerData.last_seen,
        totalCalls: partnerData.total_calls,
        createdAt: partnerData.created_at,
      };

      return {
        partner,
        matchId: matchData.id,
        tokensDeducted,
      };
    } catch (error) {
      throw new Error(`Matching failed: ${error.message}`);
    } finally {
      // Remove user from active matches
      this.activeMatches.delete(userId);
    }
  }

  // Get online users count by filters
  static async getOnlineUsersCount(filters = {}) {
    try {
      // Total online users
      const { count: totalCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_online', true);

      // By country
      const { data: countryData } = await supabase
        .from('users')
        .select('country')
        .eq('is_online', true);

      // By gender
      const { data: genderData } = await supabase
        .from('users')
        .select('gender')
        .eq('is_online', true);

      const byCountry = {};
      const byGender = {};

      countryData?.forEach(user => {
        byCountry[user.country] = (byCountry[user.country] || 0) + 1;
      });

      genderData?.forEach(user => {
        byGender[user.gender] = (byGender[user.gender] || 0) + 1;
      });

      return {
        total: totalCount || 0,
        byCountry,
        byGender,
      };
    } catch (error) {
      console.error('Failed to get online users count:', error);
      return { total: 0, byCountry: {}, byGender: {} };
    }
  }

  // Get user's match history
  static async getUserMatches(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:users!matches_user1_id_fkey(name, country, gender, avatar_url),
          user2:users!matches_user2_id_fkey(name, country, gender, avatar_url)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user matches:', error);
      return [];
    }
  }

  // Update user online status
  static async updateOnlineStatus(userId, isOnline) {
    try {
      await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }

  // Get matching statistics
  static async getMatchingStats() {
    try {
      // Total and active matches
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('id', { count: 'exact' });

      const { count: activeMatches } = await supabase
        .from('matches')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      // Average duration
      const { data: durationData } = await supabase
        .from('matches')
        .select('duration_seconds')
        .not('duration_seconds', 'is', null);

      let averageDuration = 0;
      if (durationData && durationData.length > 0) {
        const totalDuration = durationData.reduce((sum, match) => sum + (match.duration_seconds || 0), 0);
        averageDuration = Math.round(totalDuration / durationData.length);
      }

      // Top countries
      const { data: countryData } = await supabase
        .from('users')
        .select('country')
        .eq('is_online', true);

      const countryCounts = {};
      countryData?.forEach(user => {
        countryCounts[user.country] = (countryCounts[user.country] || 0) + 1;
      });

      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalMatches: totalMatches || 0,
        activeMatches: activeMatches || 0,
        averageDuration,
        topCountries,
      };
    } catch (error) {
      console.error('Failed to get matching stats:', error);
      return {
        totalMatches: 0,
        activeMatches: 0,
        averageDuration: 0,
        topCountries: [],
      };
    }
  }
}

// Helper function to calculate match compatibility score
export const calculateCompatibilityScore = (user1, user2) => {
  let score = 0;

  // Same country bonus
  if (user1.country === user2.country) {
    score += 30;
  }

  // Age compatibility (closer ages get higher score)
  const ageDiff = Math.abs(user1.age - user2.age);
  if (ageDiff <= 2) score += 20;
  else if (ageDiff <= 5) score += 15;
  else if (ageDiff <= 10) score += 10;

  // Premium users get slight bonus
  if (user1.is_premium || user2.is_premium) {
    score += 10;
  }

  // Activity bonus (recently active users)
  const lastSeenDiff = new Date().getTime() - new Date(user2.last_seen).getTime();
  const hoursSinceLastSeen = lastSeenDiff / (1000 * 60 * 60);
  
  if (hoursSinceLastSeen <= 1) score += 15;
  else if (hoursSinceLastSeen <= 24) score += 10;

  return Math.min(score, 100); // Cap at 100
};
