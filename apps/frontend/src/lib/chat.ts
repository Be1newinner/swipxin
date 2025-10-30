// Simple chat service for video calls
export class ChatService {
  constructor() {
    this.messages = [];
    this.listeners = [];
  }

  // Add a message to the chat
  addMessage(message) {
    this.messages.push({
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    });
    
    this.notifyListeners('message_added', message);
  }

  // Get all messages
  getMessages() {
    return this.messages;
  }

  // Clear all messages
  clearMessages() {
    this.messages = [];
    this.notifyListeners('messages_cleared');
  }

  // Add a listener for chat events
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in chat listener:', error);
      }
    });
  }

  // Send a message (in a real app, this would send to a server)
  sendMessage(text, sender = 'user') {
    const message = {
      text,
      sender,
      timestamp: new Date()
    };
    
    this.addMessage(message);
    return message;
  }

  // Simulate receiving a message from partner
  simulatePartnerMessage(text) {
    return this.sendMessage(text, 'partner');
  }
}

// Export a singleton instance
export default new ChatService();
