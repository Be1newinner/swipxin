import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import IsolatedMatchingService from '../lib/isolatedMatching';

export function MatchTestPage() {
  const [testUsers, setTestUsers] = useState([
    { id: 'test_user_1', name: 'Alice', tokens: 5 },
    { id: 'test_user_2', name: 'Bob', tokens: 5 },
  ]);
  
  const [matchingServices, setMatchingServices] = useState({});
  const [userStates, setUserStates] = useState({});
  const [simulatedMatches, setSimulatedMatches] = useState([]);
  
  useEffect(() => {
    // Initialize matching services for test users
    const services = {};
    const states = {};
    
    testUsers.forEach(user => {
      services[user.id] = new IsolatedMatchingService(user.id);
      states[user.id] = {
        isSearching: false,
        currentMatch: null,
        isInVideoChat: false,
      };
    });
    
    setMatchingServices(services);
    setUserStates(states);
    
    return () => {
      // Cleanup
      Object.values(services).forEach(service => service.unsubscribe());
    };
  }, []);
  
  const updateUserState = (userId, updates) => {
    setUserStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], ...updates }
    }));
  };
  
  const startSearch = async (userId) => {
    const service = matchingServices[userId];
    const user = testUsers.find(u => u.id === userId);
    
    if (!service || !user) return;
    
    console.log(`🔍 Starting search for ${user.name} (${userId})`);
    
    updateUserState(userId, { isSearching: true });
    toast.info(`${user.name} started searching...`);
    
    // Subscribe to match notifications
    service.subscribeToMatches({
      onMatchFound: (match) => {
        console.log(`🎉 ${user.name} received match notification:`, match);
        
        updateUserState(userId, {
          isSearching: false,
          currentMatch: match,
          isInVideoChat: true
        });
        
        toast.success(`${user.name} found a match with ${match.partner?.name}!`);
      },
      onMatchEnded: (match) => {
        console.log(`📞 ${user.name} match ended:`, match);
        updateUserState(userId, {
          currentMatch: null,
          isInVideoChat: false
        });
        toast.info(`${user.name}'s call ended`);
      }
    });
    
    try {
      // Start actual matching
      const match = await service.findMatch();
      
      if (match) {
        console.log(`✅ ${user.name} found match directly:`, match);
        updateUserState(userId, {
          isSearching: false,
          currentMatch: match,
          isInVideoChat: true
        });
        toast.success(`${user.name} matched directly!`);
      }
    } catch (error) {
      console.log(`❌ ${user.name} search failed:`, error);
      updateUserState(userId, { isSearching: false });
      if (!error.message.includes('timeout')) {
        toast.error(`${user.name}: ${error.message}`);
      }
    }
  };
  
  const cancelSearch = (userId) => {
    const service = matchingServices[userId];
    const user = testUsers.find(u => u.id === userId);
    
    if (!service || !user) return;
    
    console.log(`❌ Cancelling search for ${user.name}`);
    service.cancelMatching();
    updateUserState(userId, { isSearching: false });
    toast.info(`${user.name} cancelled search`);
  };
  
  const endCall = (userId) => {
    const service = matchingServices[userId];
    const user = testUsers.find(u => u.id === userId);
    const currentMatch = userStates[userId]?.currentMatch;
    
    if (!service || !user || !currentMatch) return;
    
    console.log(`📞 Ending call for ${user.name}`);
    service.endMatch(currentMatch.id);
    updateUserState(userId, {
      currentMatch: null,
      isInVideoChat: false
    });
    toast.success(`${user.name} ended the call`);
  };
  
  const simulateMatch = () => {
    const user1 = testUsers[0];
    const user2 = testUsers[1];
    
    const matchData = {
      matchId: `match_${Date.now()}`,
      roomId: `room_${Date.now()}`,
      user1: user1,
      user2: user2,
      user1Id: user1.id,
      user2Id: user2.id,
    };
    
    console.log('🎯 Simulating match between users:', matchData);
    
    // Send match notification to both users
    const service1 = matchingServices[user1.id];
    const service2 = matchingServices[user2.id];
    
    if (service1) {
      // Simulate receiving match for user1
      const match1 = {
        ...matchData,
        partner: user2,
        isInitiator: true
      };
      
      setTimeout(() => {
        console.log(`📤 Sending match to ${user1.name}:`, match1);
        // Trigger the match found callback directly for simulation
        updateUserState(user1.id, {
          isSearching: false,
          currentMatch: match1,
          isInVideoChat: true
        });
        toast.success(`${user1.name} received match notification!`);
      }, 500);
    }
    
    if (service2) {
      // Simulate receiving match for user2
      const match2 = {
        ...matchData,
        partner: user1,
        isInitiator: false
      };
      
      setTimeout(() => {
        console.log(`📤 Sending match to ${user2.name}:`, match2);
        // Trigger the match found callback directly for simulation
        updateUserState(user2.id, {
          isSearching: false,
          currentMatch: match2,
          isInVideoChat: true
        });
        toast.success(`${user2.name} received match notification!`);
      }, 600);
    }
    
    setSimulatedMatches(prev => [...prev, matchData]);
  };
  
  const clearAll = () => {
    Object.keys(userStates).forEach(userId => {
      updateUserState(userId, {
        isSearching: false,
        currentMatch: null,
        isInVideoChat: false
      });
    });
    setSimulatedMatches([]);
    toast.info('All states cleared');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Match Flow Testing</h1>
          <p className="text-muted-foreground mb-6">
            Test the isolated matching service and video chat transitions
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button onClick={() => startSearch(testUsers[0].id)} variant="default">
              Start Alice's Search
            </Button>
            <Button onClick={() => startSearch(testUsers[1].id)} variant="default">
              Start Bob's Search
            </Button>
            <Button onClick={simulateMatch} variant="secondary">
              Simulate Match
            </Button>
            <Button onClick={clearAll} variant="outline">
              Clear All
            </Button>
          </div>
        </Card>
        
        {/* User Status Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {testUsers.map(user => {
            const state = userStates[user.id] || {};
            return (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <Badge variant={state.isInVideoChat ? 'default' : state.isSearching ? 'secondary' : 'outline'}>
                    {state.isInVideoChat ? 'In Call' : state.isSearching ? 'Searching' : 'Idle'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Status:</strong> {
                      state.isInVideoChat ? '📹 Video Chat' :
                      state.isSearching ? '🔍 Searching...' :
                      '⏳ Ready'
                    }
                  </div>
                  
                  {state.currentMatch && (
                    <div className="text-sm">
                      <strong>Partner:</strong> {state.currentMatch.partner?.name || 'Unknown'}
                      <br />
                      <strong>Room:</strong> {state.currentMatch.roomId}
                      <br />
                      <strong>Role:</strong> {state.currentMatch.isInitiator ? 'Initiator' : 'Receiver'}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    {!state.isSearching && !state.isInVideoChat && (
                      <Button onClick={() => startSearch(user.id)} size="sm">
                        Start Search
                      </Button>
                    )}
                    
                    {state.isSearching && (
                      <Button onClick={() => cancelSearch(user.id)} size="sm" variant="outline">
                        Cancel Search
                      </Button>
                    )}
                    
                    {state.isInVideoChat && (
                      <Button onClick={() => endCall(user.id)} size="sm" variant="destructive">
                        End Call
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Simulated Matches Log */}
        {simulatedMatches.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Simulated Matches</h3>
            <div className="space-y-2">
              {simulatedMatches.map((match, index) => (
                <div key={index} className="text-sm p-3 bg-muted rounded">
                  <strong>Match {index + 1}:</strong> {match.user1.name} ↔ {match.user2.name}
                  <br />
                  <strong>Room:</strong> {match.roomId}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default MatchTestPage;
