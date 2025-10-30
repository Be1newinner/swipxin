import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import socketService from '../lib/socket';

export function SocketTestPage({ user }) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Connect to socket if not already connected
    if (!socketService.isSocketConnected()) {
      console.log('🔌 Connecting to socket...');
      socketService.connect(user.token || 'test-token');
      
      // Wait for connection
      const checkConnection = setInterval(() => {
        if (socketService.isSocketConnected()) {
          setIsConnected(true);
          setSocketId(socketService.getSocketId());
          clearInterval(checkConnection);
          console.log('✅ Socket connected with ID:', socketService.getSocketId());
        }
      }, 100);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkConnection), 10000);
    } else {
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
    }

    // Set up event listeners to track all incoming events
    const addEvent = (eventName) => (data) => {
      console.log(`📨 [${user.id}] Received ${eventName}:`, data);
      setEvents(prev => [...prev, {
        id: Date.now(),
        eventName,
        data,
        timestamp: new Date().toISOString()
      }]);
    };

    // Listen to all relevant events
    socketService.on('connect', addEvent('connect'));
    socketService.on('disconnect', addEvent('disconnect'));
    socketService.on('matchFound', addEvent('matchFound'));
    socketService.on('matchingError', addEvent('matchingError'));
    socketService.on('matchingTimeout', addEvent('matchingTimeout'));
    socketService.on('matchingStatus', addEvent('matchingStatus'));
    socketService.on('userOnline', addEvent('userOnline'));
    socketService.on('userOffline', addEvent('userOffline'));

    return () => {
      console.log('🔌 Cleaning up socket test listeners');
      socketService.removeAllListeners('connect');
      socketService.removeAllListeners('disconnect'); 
      socketService.removeAllListeners('matchFound');
      socketService.removeAllListeners('matchingError');
      socketService.removeAllListeners('matchingTimeout');
      socketService.removeAllListeners('matchingStatus');
      socketService.removeAllListeners('userOnline');
      socketService.removeAllListeners('userOffline');
    };
  }, [user]);

  const joinQueue = () => {
    if (!socketService.isSocketConnected()) {
      console.log('❌ Socket not connected');
      return;
    }

    console.log('🚀 Joining matching queue...');
    socketService.joinMatchingQueue({ preferredGender: null });
    
    setEvents(prev => [...prev, {
      id: Date.now(),
      eventName: 'joinMatchingQueue',
      data: { action: 'SENT', preferredGender: null },
      timestamp: new Date().toISOString()
    }]);
  };

  const leaveQueue = () => {
    if (!socketService.isSocketConnected()) {
      console.log('❌ Socket not connected');
      return;
    }

    console.log('🚨 Leaving matching queue...');
    socketService.leaveMatchingQueue();
    
    setEvents(prev => [...prev, {
      id: Date.now(),
      eventName: 'leaveMatchingQueue',
      data: { action: 'SENT' },
      timestamp: new Date().toISOString()
    }]);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  if (!user) {
    return <div className="p-6">Please login to test socket connection</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Socket Connection Test</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <strong>User:</strong> {user.name} ({user.id})
            </div>
            <div>
              <strong>Connected:</strong> <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? '✅ Yes' : '❌ No'}
              </Badge>
            </div>
            <div>
              <strong>Socket ID:</strong> {socketId || 'None'}
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={joinQueue} disabled={!isConnected}>
              Join Matching Queue
            </Button>
            <Button onClick={leaveQueue} disabled={!isConnected} variant="outline">
              Leave Queue
            </Button>
            <Button onClick={clearEvents} variant="secondary">
              Clear Events
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Socket Events ({events.length})</h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No events received yet...</p>
            ) : (
              events.slice(-20).reverse().map(event => (
                <div key={event.id} className="p-3 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-primary">{event.eventName}</strong>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SocketTestPage;
