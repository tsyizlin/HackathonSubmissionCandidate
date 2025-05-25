import { useState, useEffect, useCallback, useRef } from 'react';
import { WakuClient } from '../lib/waku-client';
import { WakuMessageConfig } from '../lib/waku-app-config'; // Import WakuMessageConfig

export interface UseWakuOptions {
  wakuNodeUrl: string; // This might become less relevant if WakuClient handles its own connection
  wakuNodeType: 'light' | 'relay'; // This might become less relevant if WakuClient is always light
  onMessageReceived?: (message: any, contentTopic: string) => void; // Generalized callback
  shouldConnect: boolean; // New prop to control connection
  messageConfigs: WakuMessageConfig[]; // New prop to pass message configurations
}

export const useWaku = ({
  wakuNodeUrl,
  wakuNodeType,
  onMessageReceived,
  shouldConnect, // Destructure new prop
  messageConfigs, // Destructure new prop
}: UseWakuOptions) => {
  const [wakuClient, setWakuClient] = useState<WakuClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const onMessageReceivedRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const connect = useCallback(async (configs: WakuMessageConfig[]) => {
    // Useful log: Shows the type of Waku node being initiated.
    console.log(`[Waku Hook] Attempting to connect with node type: ${wakuNodeType}`);
    // Useful log: Shows the target Waku node URL (relevant for relay, less for light but good to know).
    console.log(`[Waku Hook] Waku Node URL: ${wakuNodeUrl}`);
    // Useful log: Displays all message configurations, including contentTopics, for this connection.
    console.log('[Waku Hook] Connecting with message configs:', JSON.stringify(configs.map(c => ({ name: c.messageName, topic: c.contentTopic })), null, 2));

    if (wakuNodeType !== 'light') {
      // Useful log: Indicates why a connection might not proceed.
      console.warn('[Waku Hook] Waku connection only supported for light node type. Aborting connection.');
      return;
    }

    if (wakuClient && wakuClient.isConnected()) {
      // Useful log: Explains if an existing connection is reused.
      console.log('[Waku Hook] Waku initialization skipped: client already connected.');
      return;
    }

    if (isConnecting) {
      // Useful log: Prevents redundant connection attempts.
      console.log('[Waku Hook] Waku initialization skipped: already connecting.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    // Useful log: Marks the beginning of the connection process.
    console.log('[Waku Hook] Starting Waku connection process...');

    try {
      // Useful log: Indicates instantiation of the WakuClient.
      console.log('[Waku Hook] Initializing WakuClient with configs:', configs.map(c => c.contentTopic));
      const client = new WakuClient(configs);
      
      client.onMessageReceived((message: any, contentTopic: string) => {
        // Useful log: Shows that the message received callback is being set up.
        // console.log(`[Waku Hook] Setting up onMessageReceived callback. Ready to process messages for topic: ${contentTopic}`);
        onMessageReceivedRef.current?.(message, contentTopic);
      });

      // Useful log: Marks the call to start the WakuClient.
      console.log('[Waku Hook] Calling WakuClient.start()...');
      await client.start();
      setWakuClient(client);
      setIsConnected(true);
      setIsConnecting(false);
      // Useful log: Confirms successful connection.
      console.log('[Waku Hook] WakuClient started and connected successfully.');

      const interval = setInterval(() => {
        setPeerCount(client.getPeerCount());
      }, 5000);

      return () => clearInterval(interval);

    } catch (err) {
      // Useful log: Captures and displays errors during connection.
      console.error('[Waku Hook] Error initializing Waku:', err);
      let errorMessage = 'Failed to initialize Waku';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Connection timed out. Please check your network connection and try again.';
        } else if (err.message.includes('bootstrap')) {
          errorMessage = 'Could not connect to the network. Please try again in a few moments.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
      // Useful log: Indicates connection failure.
      console.log('[Waku Hook] Waku connection failed.');
    }
  }, [wakuNodeType, isConnecting, wakuClient, wakuNodeUrl]); // Added wakuNodeUrl for logging

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    // Useful log: Tracks the decision to connect or disconnect based on `shouldConnect`.
    console.log(`[Waku Hook Effect] shouldConnect: ${shouldConnect}, wakuNodeType: ${wakuNodeType}, wakuClient exists: ${!!wakuClient}, wakuClient connected: ${wakuClient?.isConnected()}`);

    if (shouldConnect && wakuNodeType === 'light') {
      if (!wakuClient || !wakuClient.isConnected()) {
        // Useful log: Triggering connection attempt.
        console.log('[Waku Hook Effect] Conditions met for connection. Calling connect...');
        connect(messageConfigs).then(cl => {
          if (cl) cleanup = cl;
        });
      } else {
        // Useful log: Indicates an existing connection is maintained.
        console.log('[Waku Hook Effect] Already connected. No new connection needed.');
      }
    } else if (!shouldConnect && wakuClient) {
      // Useful log: Triggering disconnection.
      console.log('[Waku Hook Effect] shouldConnect is false and client exists. Stopping Waku client...');
      wakuClient.stop();
      setIsConnected(false);
      setWakuClient(null);
      // Useful log: Confirms client has been stopped.
      console.log('[Waku Hook Effect] Waku client stopped.');
    }

    return () => {
      // Useful log: Indicates cleanup execution, important for resource management.
      console.log('[Waku Hook Effect] Cleaning up Waku instance in useEffect...');
      cleanup?.();
    };
  }, [wakuNodeType, shouldConnect, messageConfigs, wakuClient, connect]);

  // Modified sendMessage to accept messageName
  const sendMessage = useCallback(async (messageData: { text: string }, messageName: string) => {
    // Useful log: Checks if client is ready before sending a message.
    console.log(`[Waku Hook] Attempting to send message. WakuClient exists: ${!!wakuClient}`);
    if (!wakuClient) {
      setError('Waku client not initialized.');
      // Useful log: Explains why a message send might fail.
      console.error('[Waku Hook] Send message failed: Waku client not initialized.');
      return false;
    }

    try {
      const getTabSpecificSenderId = () => {
        const tabId = sessionStorage.getItem('wakuTabId') || `tab-${Math.random().toString(36).substring(2, 10)}`;
        if (!sessionStorage.getItem('wakuTabId')) {
          sessionStorage.setItem('wakuTabId', tabId);
        }
        const userId = localStorage.getItem('wakuUserId') || `user-${Math.random().toString(36).substring(2, 10)}`;
        if (!localStorage.getItem('wakuUserId')) {
          localStorage.setItem('wakuUserId', userId);
        }
        return `${userId}-${tabId}`;
      };

      const senderId = getTabSpecificSenderId();
      sessionStorage.setItem('wakuSenderId', senderId);

      // Useful log: Shows which message configuration is being used for sending.
      const config = messageConfigs.find(cfg => cfg.messageName === messageName);
      console.log(`[Waku Hook] Preparing to send message with name: ${messageName}, using config:`, config ? { name: config.messageName, topic: config.contentTopic } : 'Not Found');

      if (!config) {
        console.error(`[Waku Hook] Message config not found for messageName: ${messageName}.`);
        return false;
      }

      // Create the message object that matches our TypeScript interface
      const messageObject = {
        timestamp: Date.now(),
        sender: senderId,
        text: messageData.text,
      };

      // Useful log: Confirms the message is being sent via WakuClient.
      console.log(`[Waku Hook] Sending JSON message for topic: ${config.contentTopic}`);
      return wakuClient.send(config.messageName, messageObject);
    } catch (err) {
      // Useful log: Captures errors during message preparation or sending.
      console.error('[Waku Hook] Error preparing or sending message:', err);
      return false;
    }
  }, [wakuClient, messageConfigs]);

  const reconnectWaku = useCallback(async () => {
    // Useful log: Indicates a manual reconnection attempt.
    console.log('[Waku Hook] Manual Waku reconnection requested.');
    await wakuClient?.stop();
    setIsConnected(false);
    setWakuClient(null);
    setError(null);
    setIsConnecting(false);
    // Useful log: State reset before attempting reconnection.
    console.log('[Waku Hook] Waku client stopped and state reset for reconnection.');
    setTimeout(() => {
      if (shouldConnect) {
        // Useful log: Re-triggering connection after a delay.
        console.log('[Waku Hook] Attempting to reconnect now...');
        connect(messageConfigs);
      } else {
        // Useful log: Indicates reconnection is not proceeding as `shouldConnect` is false.
        console.log('[Waku Hook] Reconnection aborted as shouldConnect is false.');
      }
    }, 1000);
  }, [wakuClient, shouldConnect, messageConfigs, connect]);

  return {
    isConnecting,
    isConnected,
    error,
    sendMessage, // This function now accepts messageName
    peerCount,
    contentTopics: wakuClient?.getContentTopics() || [],
    reconnect: reconnectWaku,
    connect: connect, // Expose the connect function
  };
};

export default useWaku;
