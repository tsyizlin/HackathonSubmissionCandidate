// lib/waku-client.ts

import {
  createLightNode,
  DecodedMessage,
  LightNode,
  Protocols,
  FilterSubscription,
  IDecoder,
  IEncoder,
} from "@waku/sdk";
import { DEDICATED_STORE_PEER, WakuMessageConfig } from './waku-app-config';

// Define a generic WakuMessage type that can be used internally by WakuClient
// This type will be replaced by the application-specific message type via the messageProcessor
type WakuMessage = any; // This will be dynamically typed based on the message config

export class WakuClient {
  private node: LightNode | null = null;
  private encoders: Map<string, IEncoder> = new Map();
  private decoders: Map<string, IDecoder<DecodedMessage>> = new Map();
  private subscription: FilterSubscription | null = null;
  private messageConfigs: WakuMessageConfig[];
  private onMessageReceivedCallback: ((message: WakuMessage, contentTopic: string) => void) | null = null;

  constructor(messageConfigs: WakuMessageConfig[]) {
    if (!messageConfigs || messageConfigs.length === 0) {
      throw new Error("WakuClient must be initialized with at least one message configuration.");
    }
    this.messageConfigs = messageConfigs;
    // Useful log: Shows the configurations the WakuClient is initialized with.
    console.log('[WakuClient Constructor] Initialized with message configs:', JSON.stringify(this.messageConfigs.map(c => ({ name: c.messageName, topic: c.contentTopic })), null, 2));
  }

  public async start(): Promise<void> {
    // Useful log: Indicates the start of the Waku node initialization process.
    console.log('[WakuClient Start] Attempting to start Waku Light Node...');
    if (this.node && this.node.isStarted()) {
      // Useful log: Prevents re-initialization if already started.
      console.log('[WakuClient Start] Waku node already started. Skipping initialization.');
      return;
    }

    try {
      // Useful log: Details the parameters for creating the light node.
      console.log("[WakuClient Start] Creating LightNode with defaultBootstrap: false, store peer:", DEDICATED_STORE_PEER);
      const lightNode = await createLightNode({
        logLevel: 'debug', // Set to 'trace' for even more verbose Waku SDK logs
        defaultBootstrap: false, // We will manually dial bootstrap nodes
        networkConfig: {
          clusterId: 42,
          contentTopics: this.messageConfigs.map(c => c.contentTopic)
        },
        store: {
          peer: DEDICATED_STORE_PEER // Using a dedicated store peer
        }
      });

      // Useful log: Confirms node creation and initiation of the start sequence.
      console.log('[WakuClient Start] LightNode created. Starting node...');
      await lightNode.start();
      // Useful log: Confirms the node has successfully started.
      console.log('[WakuClient Start] Waku node started successfully.');

      // Useful log: Lists the bootstrap nodes that will be dialed.
      const bootstrapNodes = [DEDICATED_STORE_PEER]; // Add more bootstrap nodes if needed
      console.log('[WakuClient Start] Bootstrap nodes to dial:', bootstrapNodes);
      let connectedToAnyNode = false;
      for (const peer of bootstrapNodes) {
        try {
          // Useful log: Shows each attempt to connect to a bootstrap peer.
          console.log(`[WakuClient Start] Attempting to dial bootstrap peer: ${peer}...`);
          await lightNode.dial(peer);
          connectedToAnyNode = true;
          // Useful log: Confirms successful connection to a bootstrap peer.
          console.log(`[WakuClient Start] Successfully dialed bootstrap peer: ${peer}`);
        } catch (error) {
          // Useful log: Captures errors if a specific bootstrap peer connection fails.
          console.warn(`[WakuClient Start] Failed to dial bootstrap peer ${peer}:`, error);
        }
      }

      if (!connectedToAnyNode) {
        // Useful log: Critical error if no bootstrap connection is made.
        console.error('[WakuClient Start] Failed to connect to any bootstrap nodes. Aborting.');
        throw new Error('Failed to connect to any bootstrap nodes');
      }

      // Useful log: Indicates the client is waiting for necessary peer protocols.
      console.log('[WakuClient Start] Waiting for peers with required protocols (LightPush, Filter, Store)...');
      await Promise.race([
        lightNode.waitForPeers([Protocols.LightPush, Protocols.Filter, Protocols.Store]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Peer connection timeout (30s)')), 30000)
        )
      ]);
      // Useful log: Confirms that peers with the required protocols have been found.
      console.log('[WakuClient Start] Peers with required protocols found.');

      this.node = lightNode;
      // Useful log: Triggers the setup of message encoders and decoders.
      console.log('[WakuClient Start] Setting up message encoders and decoders...');
      this.setupMessageEncodersAndDecoders();

      // Useful log: Triggers the querying of historical messages.
      console.log('[WakuClient Start] Querying historical messages...');
      await this.queryHistoricalMessages();
      // Useful log: Triggers subscription to live messages.
      console.log('[WakuClient Start] Subscribing to live messages...');
      await this.subscribeToLiveMessages();
      // Useful log: Confirms the WakuClient start sequence is complete.
      console.log('[WakuClient Start] WakuClient fully started and operational.');

    } catch (err) {
      // Useful log: General error catcher for the start process.
      console.error('[WakuClient Start] Error initializing Waku:', err);
      throw err;
    }
  }

  public async stop(): Promise<void> {
    // Useful log: Indicates the start of the Waku node stop sequence.
    console.log('[WakuClient Stop] Attempting to stop Waku node...');
    if (this.subscription) {
      // Useful log: Shows unsubscription from live messages.
      console.log('[WakuClient Stop] Unsubscribing from live messages.');
      // The Waku SDK's FilterSubscription doesn't have a direct unsubscribeAll,
      // but stopping the node should clean up subscriptions.
      // For explicit unsubscribe, one would need to store individual subscriptions.
      this.subscription = null; // Or call unsubscribe if available on the specific subscription object
    }
    if (this.node) {
      // Useful log: Shows the node stop command is being issued.
      console.log('[WakuClient Stop] Stopping the LightNode instance.');
      await this.node.stop();
      this.node = null;
      // Useful log: Confirms the node has been stopped.
      console.log('[WakuClient Stop] LightNode stopped.');
    }
    this.encoders.clear();
    this.decoders.clear();
    // Useful log: Confirms cleanup of encoders and decoders.
    console.log('[WakuClient Stop] Encoders and decoders cleared. WakuClient stopped.');
  }

  public isConnected(): boolean {
    const connected = !!this.node && this.node.isStarted();
    // Useful log: Provides current connection status.
    // console.log(`[WakuClient isConnected] Status: ${connected}`);
    return connected;
  }

  public getPeerCount(): number {
    const count = this.node?.libp2p.getPeers().length || 0;
    // Useful log: Provides current peer count.
    // console.log(`[WakuClient getPeerCount] Count: ${count}`);
    return count;
  }

  public getContentTopics(): string[] {
    const topics = this.messageConfigs.map(config => config.contentTopic);
    // Useful log: Lists all content topics the client is configured for.
    // console.log('[WakuClient getContentTopics] Configured topics:', topics);
    return topics;
  }

  public onMessageReceived(callback: (message: WakuMessage, contentTopic: string) => void): void {
    this.onMessageReceivedCallback = callback;
    // Useful log: Confirms that a message received callback has been registered.
    console.log('[WakuClient onMessageReceived] Callback registered.');
  }

  private setupMessageEncodersAndDecoders(): void {
    if (!this.node) {
      // Useful log: Error condition if node is not initialized.
      console.error('[WakuClient SetupEncodersDecoders] Waku node not initialized. Cannot setup.');
      return;
    }

    // Useful log: Iterates through each message config to set up its encoder/decoder.
    this.messageConfigs.forEach(config => {
      const { contentTopic, messageName } = config;
      // Useful log: Details for each encoder/decoder setup.
      console.log(`[WakuClient SetupEncodersDecoders] Setting up for message: ${messageName}, topic: ${contentTopic}`);
      this.encoders.set(
        messageName,
        this.node.createEncoder({ contentTopic, ephemeral: false })
      );
      this.decoders.set(
        messageName,
        this.node.createDecoder({ contentTopic }) as IDecoder<DecodedMessage>
      );
      console.log(`[WakuClient SetupEncodersDecoders] Encoder/decoder for ${messageName} on ${contentTopic} ready.`);
    });
    // Useful log: Confirms completion of encoder/decoder setup.
    console.log('[WakuClient SetupEncodersDecoders] All encoders and decoders configured.');
  }

  private async queryHistoricalMessages(): Promise<void> {
    if (!this.node || this.decoders.size === 0) {
      // Useful log: Checks readiness for historical query.
      console.error('[WakuClient QueryHistorical] Node or decoders not ready. Aborting query.');
      return;
    }

    // Useful log: Defines the callback for processing historical messages.
    const historicalMessagesCallback = (wakuMessage: DecodedMessage) => {
      // console.log(`[WakuClient QueryHistorical] Received historical message on topic: ${wakuMessage.contentTopic}`);
      if (!wakuMessage.contentTopic) return;

      const config = this.messageConfigs.find(
        (cfg) => cfg.contentTopic === wakuMessage.contentTopic
      );

      if (config) {
        // Useful log: Shows which config is used to process a message.
        // console.log(`[WakuClient QueryHistorical] Processing historical message with config: ${config.messageName}`);
        const processedMessage = config.processMessage(wakuMessage);
        if (processedMessage && this.onMessageReceivedCallback) {
          this.onMessageReceivedCallback(processedMessage, wakuMessage.contentTopic);
        }
      } else {
        // Useful log: Warns about messages on unexpected topics.
        console.warn(`[WakuClient QueryHistorical] Received historical message on unknown topic: ${wakuMessage.contentTopic}`);
      }
    };

    try {
      const decodersArray = Array.from(this.decoders.values());
      // Useful log: Lists topics for which historical messages are being queried.
      console.log(`[WakuClient QueryHistorical] Querying historical messages for ${decodersArray.length} topics:`, this.getContentTopics());
      await this.node.store.queryWithOrderedCallback(decodersArray, historicalMessagesCallback);
      // Useful log: Confirms completion of historical message query.
      console.log('[WakuClient QueryHistorical] Finished querying historical messages.');
    } catch (error) {
      // Useful log: Captures errors during historical message query.
      console.error('[WakuClient QueryHistorical] Error querying historical messages:', error);
    }
  }

  private async subscribeToLiveMessages(): Promise<void> {
    if (!this.node || this.decoders.size === 0) {
      // Useful log: Checks readiness for live subscription.
      console.error('[WakuClient SubscribeLive] Node or decoders not ready. Aborting subscription.');
      return;
    }

    // Useful log: Defines the handler for incoming live messages.
    const messageHandler = (wakuMessage: DecodedMessage) => {
      // console.log(`[WakuClient SubscribeLive] Received live message on topic: ${wakuMessage.contentTopic}`);
      if (!wakuMessage.contentTopic) return;

      const config = this.messageConfigs.find(
        (cfg) => cfg.contentTopic === wakuMessage.contentTopic
      );

      if (config) {
        // Useful log: Shows which config is used to process a live message.
        // console.log(`[WakuClient SubscribeLive] Processing live message with config: ${config.messageName}`);
        const processedMessage = config.processMessage(wakuMessage);
        if (processedMessage && this.onMessageReceivedCallback) {
          this.onMessageReceivedCallback(processedMessage, wakuMessage.contentTopic);
        }
      } else {
        // Useful log: Warns about live messages on unexpected topics.
        console.warn(`[WakuClient SubscribeLive] Received live message on unknown topic: ${wakuMessage.contentTopic}`);
      }
    };

    try {
      const decodersArray = Array.from(this.decoders.values());
      // Useful log: Lists topics for which live messages are being subscribed to.
      console.log(`[WakuClient SubscribeLive] Subscribing to live messages for ${decodersArray.length} topics:`, this.getContentTopics());
      this.subscription = await this.node.filter.subscribe(decodersArray, messageHandler);
      // Useful log: Confirms successful subscription to live messages.
      console.log('[WakuClient SubscribeLive] Successfully subscribed to live messages.');
    } catch (err) {
      // Useful log: Captures errors during live message subscription.
      console.error('[WakuClient SubscribeLive] Error subscribing to live messages:', err);
      throw err;
    }
  }

  public async send(messageName: string, messageData: any): Promise<boolean> {
    // Useful log: Checks if client is ready before sending.
    console.log(`[WakuClient Send] Attempting to send message for type: ${messageName}. Connected: ${this.isConnected()}`);
    if (!this.node || !this.isConnected()) {
      // Useful log: Explains why send might fail.
      console.error('[WakuClient Send] Cannot send message: Waku client not ready or not connected.');
      return false;
    }

    const encoder = this.encoders.get(messageName);
    if (!encoder) {
      // Useful log: Critical error if no encoder is found for the message type.
      console.error(`[WakuClient Send] No encoder found for message type: ${messageName}. Please check your WakuMessageConfig.`);
      return false;
    }

    // Find the message config to get the serializer
    const config = this.messageConfigs.find(cfg => cfg.messageName === messageName);
    if (!config) {
      console.error(`[WakuClient Send] No message config found for message type: ${messageName}`);
      return false;
    }

    try {
      // Serialize the message data using JSON
      const payload = config.serializeMessage(messageData);
      
      // Useful log: Confirms message is being sent via lightPush.
      console.log(`[WakuClient Send] Sending JSON message using LightPush with encoder for ${messageName}. Payload size: ${payload.length} bytes.`);
      const result = await this.node.lightPush.send(encoder, {
        payload: payload,
      });
      
      // Check the result for failures
      console.log(`[WakuClient Send] Message for ${messageName} sent successfully. Result:`, JSON.stringify(result, null, 4));
      
      if (result && result.failures && result.failures.length > 0) {
        // Useful log: Reports failures from remote peers.
        console.error(`[WakuClient Send] Message rejected by peers:`, result.failures);
        const rejectionReasons = result.failures.map(f => f.error || 'Unknown error').join(', ');
        throw new Error(`Message rejected: ${rejectionReasons}`);
      }
      
      if (result && result.successes && result.successes.length === 0 && result.failures && result.failures.length > 0) {
        // All peers rejected the message
        throw new Error('Message rejected by all peers');
      }
      
      // Useful log: Confirms successful message send.
      console.log(`[WakuClient Send] Message for ${messageName} sent successfully to ${result?.successes?.length || 0} peers.`);
      return true;
    } catch (err) {
      // Useful log: Captures errors during message sending.
      console.error(`[WakuClient Send] Error sending message for ${messageName}:`, err);
      return false;
    }
  }
}
