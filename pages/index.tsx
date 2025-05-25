import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Import Input component
import { Waypoints, Send, MessageSquareText, Plug, Lightbulb } from "lucide-react"; // Added Plug and Lightbulb icons
import useWaku from "@/hooks/useWaku";
import {
  WakuConfessionMessage,
  ConfessionMessageConfig,
  createConfessionMessageConfig,
  WakuWisdomMessage,
  WisdomMessageConfig,
  createWisdomMessageConfig,
} from "@/lib/waku-app-config";

import { MainLayout } from "@/components/layout/main-layout";
import { StatusToast } from "@/components/common/status-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// New interface for BoardItem (Confession or Wisdom)
export interface BoardItem {
  id: string;
  text: string;
  timestamp: string;
  sender: string;
  type: 'confession' | 'wisdom';
}

export default function Home() {
  // =============================================================================
  // WAKU CONNECTION CONFIGURATION
  // =============================================================================
  // These settings control how we connect to the Waku network.
  // For light nodes, the URL is not used - connection happens automatically to bootstrap peers.
  
  const [wakuNodeUrl] = useState("http://127.0.0.1:8645");  // Not used for light node type
  const [wakuNodeType] = useState<"light" | "relay">("light");  // Always use "light" for browser apps
  
  // =============================================================================
  // CONFESSION BOARD STATE MANAGEMENT
  // =============================================================================
  // This pattern shows how to manage state for a Waku-powered feature.
  // Copy this pattern for each message type you want to implement.
  
  // Topic configuration - allows users to choose which Waku topic to join
  const [userConfessionContentTopic, setUserConfessionContentTopic] = useState<string>(ConfessionMessageConfig.contentTopic);
  const [isConfessionTopicSubmitted, setIsConfessionTopicSubmitted] = useState(false);  // CRITICAL: Controls when to connect
  const [confessionTopicError, setConfessionTopicError] = useState<string | null>(null);
  
  // Message input and display state
  const [confessionText, setConfessionText] = useState("");
  const [confessions, setConfessions] = useState<BoardItem[]>([]);  // Stores all received messages
  
  // User feedback state
  const [submitConfessionError, setSubmitConfessionError] = useState<string | null>(null);
  const [submitConfessionSuccess, setSubmitConfessionSuccess] = useState<string | null>(null);

  // Wisdom Board States
  const [userWisdomContentTopic, setUserWisdomContentTopic] = useState<string>(WisdomMessageConfig.contentTopic);
  const [isWisdomTopicSubmitted, setIsWisdomTopicSubmitted] = useState(false);
  const [wisdomTopicError, setWisdomTopicError] = useState<string | null>(null);
  const [wisdomText, setWisdomText] = useState("");
  const [wisdoms, setWisdoms] = useState<BoardItem[]>([]);
  const [submitWisdomError, setSubmitWisdomError] = useState<string | null>(null);
  const [submitWisdomSuccess, setSubmitWisdomSuccess] = useState<string | null>(null);

  // =============================================================================
  // WAKU HOOK SETUP FOR CONFESSIONS
  // =============================================================================
  // This is the core Waku integration pattern. Copy and modify this for your use case.
  
  const { 
    isConnecting: isConfessionWakuConnecting,    // True while connecting to Waku network
    isConnected: isConfessionWakuConnected,      // True when connected and ready
    error: confessionWakuError,                  // Connection error message, if any
    sendMessage: sendConfession,                 // Function to send messages (renamed for clarity)
    peerCount: confessionPeerCount,              // Number of connected Waku peers
    contentTopics: confessionContentTopics,      // List of subscribed content topics
    connect: connectConfessionWaku,              // Manual connect function (usually not needed)
  } = useWaku({
    // Connection settings (required but not used for light nodes)
    wakuNodeUrl,
    wakuNodeType,
    
    // CRITICAL: Message handler - this is called for every message received
    onMessageReceived: useCallback((message: any, contentTopic: string) => {
      // Only process messages for our specific topic
      if (contentTopic === userConfessionContentTopic) {
        const confessionMessage = message as WakuConfessionMessage;
        console.log('Received new confession:', confessionMessage);
        
        // IMPORTANT: Always check for duplicates to prevent UI issues
        // Create a unique ID for deduplication
        const messageId = `${confessionMessage.timestamp}-${confessionMessage.sender}-${confessionMessage.text}`;
        const confessionExists = confessions.some(conf => conf.id === messageId);
        if (confessionExists) {
          console.log('Confession already exists in list:', confessionMessage.text);
          return;
        }
        
        // Format timestamp for display
        const timestamp = new Date(confessionMessage.timestamp).toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        
        // Convert to UI format and add to state
        const newConfession: BoardItem = {
          id: messageId,
          text: confessionMessage.text,
          timestamp,
          sender: confessionMessage.sender,
          type: 'confession',
        };
        
        // Add new message to the beginning of the list
        setConfessions(prev => [newConfession, ...prev]);
        
        // Show success feedback to user
        setSubmitConfessionSuccess(`New confession received!`);
        setTimeout(() => setSubmitConfessionSuccess(null), 3000);
      } else {
        // Log unexpected messages for debugging
        console.log(`Received message on unhandled topic ${contentTopic}:`, message);
      }
    }, [confessions, userConfessionContentTopic]),  // Dependencies: include all state used in the callback
    
    // CRITICAL: Only connect when user has submitted a topic
    shouldConnect: isConfessionTopicSubmitted,
    
    // CRITICAL: Provide message configurations only when connecting
    messageConfigs: isConfessionTopicSubmitted ? [createConfessionMessageConfig(userConfessionContentTopic)] : [],
  });

  // Waku Hook for Wisdom
  const { 
    isConnecting: isWisdomWakuConnecting,
    isConnected: isWisdomWakuConnected,
    error: wisdomWakuError,
    sendMessage: sendWisdom, // Using sendMessage for wisdom
    peerCount: wisdomPeerCount,
    contentTopics: wisdomContentTopics,
    connect: connectWisdomWaku,
  } = useWaku({
    wakuNodeUrl,
    wakuNodeType,
    onMessageReceived: useCallback((message: any, contentTopic: string) => {
      if (contentTopic === userWisdomContentTopic) {
        const wisdomMessage = message as WakuWisdomMessage;
        console.log('Received new wisdom:', wisdomMessage);
        
        const wisdomExists = wisdoms.some(wis => wis.id === `${wisdomMessage.timestamp}-${wisdomMessage.sender}-${wisdomMessage.text}`);
        if (wisdomExists) {
          console.log('Wisdom already exists in list:', wisdomMessage.text);
          return;
        }
        
        const timestamp = new Date(wisdomMessage.timestamp).toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        
        const newWisdom: BoardItem = {
          id: `${wisdomMessage.timestamp}-${wisdomMessage.sender}-${wisdomMessage.text}`,
          text: wisdomMessage.text,
          timestamp,
          sender: wisdomMessage.sender,
          type: 'wisdom',
        };
        setWisdoms(prev => [newWisdom, ...prev]);
        setSubmitWisdomSuccess(`New wisdom received!`);
        setTimeout(() => setSubmitWisdomSuccess(null), 3000);
      } else {
        console.log(`Received message on unhandled topic ${contentTopic}:`, message);
      }
    }, [wisdoms, userWisdomContentTopic]),
    shouldConnect: isWisdomTopicSubmitted,
    messageConfigs: isWisdomTopicSubmitted ? [createWisdomMessageConfig(userWisdomContentTopic)] : [],
  });

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  /**
   * Validates Waku content topic format
   * 
   * Valid format: /topic-name/version/subtopic/encoding
   * Examples:
   *   ✅ /myapp/1/general/proto
   *   ✅ /chat/1/room-123/proto  
   *   ✅ /game/1/tic-tac-toe/proto
   *   ❌ myapp/1/general/proto (missing leading slash)
   *   ❌ /myapp/general/proto (missing version number)
   *   ❌ /myapp/1/proto (missing subtopic)
   * 
   * @param topic - The content topic string to validate
   * @returns true if topic format is valid, false otherwise
   */
  const validateTopicFormat = (topic: string): boolean => {
    // Regex explanation:
    // ^\/                    - Must start with forward slash
    // [a-zA-Z0-9_-]+         - Topic name: letters, numbers, underscore, hyphen
    // \/[0-9]+              - Version: slash followed by numbers only
    // \/[a-zA-Z0-9_-]+      - Subtopic: slash followed by letters, numbers, underscore, hyphen
    // \/[a-zA-Z0-9_-]+$     - Encoding: slash followed by letters, numbers, underscore, hyphen, end of string
    const regex = /^\/[a-zA-Z0-9_-]+\/[0-9]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
    return regex.test(topic);
  };

  // =============================================================================
  // CONNECTION HANDLERS
  // =============================================================================
  // These functions handle user interaction to connect to Waku topics.
  
  const handleConnectConfession = useCallback(async () => {
    // STEP 1: Validate the topic format before attempting connection
    if (!validateTopicFormat(userConfessionContentTopic)) {
      setConfessionTopicError("Invalid topic format. Must be /topic/version/room/encoding (e.g., /cypherconfess/1/default/json)");
      return;
    }
    
    // STEP 2: Clear any previous errors
    setConfessionTopicError(null);
    
    // STEP 3: CRITICAL - This triggers the Waku connection
    // Setting this to true will cause useWaku to connect and start listening
    setIsConfessionTopicSubmitted(true);
    
    // NOTE: No manual connection call needed - the useWaku hook handles it automatically
    // when shouldConnect changes to true and messageConfigs are provided
  }, [userConfessionContentTopic]);

  const handleConnectWisdom = useCallback(async () => {
    if (!validateTopicFormat(userWisdomContentTopic)) {
      setWisdomTopicError("Invalid topic format. Must be /topic/version/room/encoding (e.g., /cypherconfess/1/wisdom/json)");
      return;
    }
    setWisdomTopicError(null);
    setIsWisdomTopicSubmitted(true);
    // The useWaku hook will now connect because shouldConnect is true
  }, [userWisdomContentTopic]);

  // =============================================================================
  // MESSAGE SENDING HANDLERS
  // =============================================================================
  // These functions handle user interaction to send messages via Waku.
  
  const handleSubmitConfession = useCallback(async () => {
    // STEP 1: Validate input
    if (!confessionText.trim()) {
      setSubmitConfessionError("Confession cannot be empty.");
      setTimeout(() => setSubmitConfessionError(null), 3000);
      return;
    }
    
    // STEP 2: CRITICAL - Check connection status before sending
    // Never attempt to send messages unless connected
    if (!isConfessionWakuConnected) {
      setSubmitConfessionError("Not connected to Waku for confessions. Please wait or check connection.");
      setTimeout(() => setSubmitConfessionError(null), 3000);
      return;
    }

    try {
      // STEP 3: Send message using the sendMessage function
      // First parameter: message data object (must match your TypeScript interface)
      // Second parameter: messageName from your message config
      const success = await sendConfession(
        { text: confessionText.trim() },           // Message data
        ConfessionMessageConfig.messageName        // Must match messageName in config
      );
      
      // STEP 4: Handle success
      if (success) {
        setSubmitConfessionSuccess("Confession sent!");
        setConfessionText(""); // Clear input on success
      } else {
        setSubmitConfessionError("Failed to send confession.");
      }
      
      // Clear feedback messages after 3 seconds
      setTimeout(() => setSubmitConfessionSuccess(null), 3000);
      setTimeout(() => setSubmitConfessionError(null), 3000);
    } catch (error) {
      // STEP 5: Handle errors
      setSubmitConfessionError(`Error sending confession: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSubmitConfessionError(null), 3000);
    }
  }, [confessionText, isConfessionWakuConnected, sendConfession]);

  const handleSubmitWisdom = useCallback(async () => {
    if (!wisdomText.trim()) {
      setSubmitWisdomError("Wisdom cannot be empty.");
      setTimeout(() => setSubmitWisdomError(null), 3000);
      return;
    }
    if (!isWisdomWakuConnected) {
      setSubmitWisdomError("Not connected to Waku for wisdom. Please wait or check connection.");
      setTimeout(() => setSubmitWisdomError(null), 3000);
      return;
    }

    try {
      const success = await sendWisdom({ text: wisdomText.trim() }, WisdomMessageConfig.messageName);
      if (success) {
        setSubmitWisdomSuccess("Wisdom sent!");
        setWisdomText(""); // Clear input
      } else {
        setSubmitWisdomError("Failed to send wisdom.");
      }
      setTimeout(() => setSubmitWisdomSuccess(null), 3000);
      setTimeout(() => setSubmitWisdomError(null), 3000);
    } catch (error) {
      setSubmitWisdomError(`Error sending wisdom: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSubmitWisdomError(null), 3000);
    }
  }, [wisdomText, isWisdomWakuConnected, sendWisdom]);

  return (
    <MainLayout>
      <StatusToast message={submitConfessionSuccess} type="success" />
      <StatusToast message={submitConfessionError} type="error" />
      <StatusToast message={submitWisdomSuccess} type="success" />
      <StatusToast message={submitWisdomError} type="error" />
      {confessionWakuError && <StatusToast message={`Confession Waku Error: ${confessionWakuError}`} type="error" />}
      {wisdomWakuError && <StatusToast message={`Wisdom Waku Error: ${wisdomWakuError}`} type="error" />}
      {confessionTopicError && <StatusToast message={`Confession Topic Error: ${confessionTopicError}`} type="error" />}
      {wisdomTopicError && <StatusToast message={`Wisdom Topic Error: ${wisdomTopicError}`} type="error" />}

      <main className="flex-1 flex flex-col p-4 md:p-8 relative z-0">
        <div className="w-full max-w-5xl mx-auto flex flex-col">
          {/* Combined Logo and Waku Status Section */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 pb-4 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 group md:w-1/4">
              <div className="p-2 rounded-lg bg-primary/15 shadow-sm group-hover:bg-primary/20 transition-all duration-300 border border-primary/10">
                <Waypoints size={22} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex items-center">
                <span className="font-bold text-lg tracking-tight font-mono">CypherConfess</span>
              </div>
              {/* Waku connection indicator - Combined for both boards */}
              <div className="flex items-center ml-2 gap-1">
                {isConfessionWakuConnected ? (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-green-500 animate-pulse terminal-glow-green"
                    title={`Confession Waku Connected (${confessionPeerCount} peers)`}
                  ></div>
                ) : isConfessionWakuConnecting ? (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-amber-500 animate-pulse terminal-glow-amber"
                    title="Connecting Confession Waku..."
                  ></div>
                ) : (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-red-500 terminal-glow-red"
                    title="Confession Waku Not Connected"
                  ></div>
                )}
                {isWisdomWakuConnected ? (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-green-500 animate-pulse terminal-glow-green"
                    title={`Wisdom Waku Connected (${wisdomPeerCount} peers)`}
                  ></div>
                ) : isWisdomWakuConnecting ? (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-amber-500 animate-pulse terminal-glow-amber"
                    title="Connecting Wisdom Waku..."
                  ></div>
                ) : (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg bg-red-500 terminal-glow-red"
                    title="Wisdom Waku Not Connected"
                  ></div>
                )}
              </div>
            </div>
            
            {/* Empty div for spacing, as icons are removed */}
            <div className="flex items-center justify-end md:w-2/4 w-full"></div>
            
            {/* Empty div for spacing, as icons are removed */}
            <div className="flex items-center gap-3 shrink-0 md:w-1/4 md:justify-end"></div>
          </div>
          
          <div className="grid gap-8">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-scanline"></div>
          </div>
          
          {/* Confession Board Section */}
          <h2 className="text-2xl font-bold font-mono text-primary mb-4">CONFESSION_BOARD</h2>
          {!isConfessionTopicSubmitted || !isConfessionWakuConnected ? (
            <Card className="mb-8">
              <CardHeader className="pb-3 border-b border-border bg-card">
                <CardTitle className="text-lg font-mono">Set Confession Waku Topic</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  Enter the Waku content topic for confessions.
                </p>
                <Input
                  type="text"
                  placeholder="/cypherconfess/1/default/json"
                  value={userConfessionContentTopic}
                  onChange={(e) => setUserConfessionContentTopic(e.target.value)}
                  className="mb-4 font-mono"
                  aria-invalid={confessionTopicError ? "true" : "false"}
                />
                <Button onClick={handleConnectConfession} className="w-full font-mono" disabled={isConfessionWakuConnecting}>
                  <Plug size={16} className="mr-2" />
                  {isConfessionWakuConnecting ? "Connecting..." : "Connect to Confession Waku"}
                </Button>
                {isConfessionWakuConnected && (
                  <p className="text-xs text-green-500 font-mono mt-2 text-center">
                    Connected to topic: {userConfessionContentTopic}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Confession Input Area */}
              <Card className="mb-8">
                <CardHeader className="pb-3 border-b border-border bg-card">
                  <CardTitle className="text-lg font-mono">Share Your Confession</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    Currently connected to topic: <span className="text-primary">{userConfessionContentTopic}</span>
                  </p>
                  <Textarea
                    placeholder="Type your anonymous confession here..."
                    value={confessionText}
                    onChange={(e) => setConfessionText(e.target.value)}
                    className="mb-4 min-h-[100px] font-mono"
                  />
                  <Button onClick={handleSubmitConfession} className="w-full font-mono" disabled={!isConfessionWakuConnected || confessionText.trim().length === 0}>
                    <Send size={16} className="mr-2" />
                    Submit Confession
                  </Button>
                </CardContent>
              </Card>

              {/* Confessions List */}
              <Card className="shadow-sm border-border relative overflow-hidden mb-8">
                <CardHeader className="pb-3 border-b border-border bg-card">
                  <CardTitle className="text-lg font-mono">Recent Confessions</CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-card">
                  <div className="h-[400px] overflow-y-auto overflow-x-hidden p-4 relative space-y-4">
                    {confessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono">
                        <MessageSquareText size={48} className="mb-3" />
                        <p>No confessions yet. Be the first to share!</p>
                      </div>
                    ) : (
                      confessions.map((conf, index) => (
                        <div key={conf.id} className="p-3 bg-muted rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors">
                          <p className="text-sm font-mono text-foreground break-words">{conf.text}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-2 text-right">
                            — Anonymous at {conf.timestamp}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-scanline"></div>
              </Card>
            </>
          )}

          {/* Wisdom Board Section */}
          <h2 className="text-2xl font-bold font-mono text-primary mb-4 mt-8">WISDOM_BOARD</h2>
          {!isWisdomTopicSubmitted || !isWisdomWakuConnected ? (
            <Card className="mb-8">
              <CardHeader className="pb-3 border-b border-border bg-card">
                <CardTitle className="text-lg font-mono">Set Wisdom Waku Topic</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  Enter the Waku content topic for wisdom.
                </p>
                <Input
                  type="text"
                  placeholder="/cypherconfess/1/wisdom/json"
                  value={userWisdomContentTopic}
                  onChange={(e) => setUserWisdomContentTopic(e.target.value)}
                  className="mb-4 font-mono"
                  aria-invalid={wisdomTopicError ? "true" : "false"}
                />
                <Button onClick={handleConnectWisdom} className="w-full font-mono" disabled={isWisdomWakuConnecting}>
                  <Plug size={16} className="mr-2" />
                  {isWisdomWakuConnecting ? "Connecting..." : "Connect to Wisdom Waku"}
                </Button>
                {isWisdomWakuConnected && (
                  <p className="text-xs text-green-500 font-mono mt-2 text-center">
                    Connected to topic: {userWisdomContentTopic}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Wisdom Input Area */}
              <Card className="mb-8">
                <CardHeader className="pb-3 border-b border-border bg-card">
                  <CardTitle className="text-lg font-mono">Share Your Wisdom</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    Currently connected to topic: <span className="text-primary">{userWisdomContentTopic}</span>
                  </p>
                  <Textarea
                    placeholder="Type your anonymous wisdom here..."
                    value={wisdomText}
                    onChange={(e) => setWisdomText(e.target.value)}
                    className="mb-4 min-h-[100px] font-mono"
                  />
                  <Button onClick={handleSubmitWisdom} className="w-full font-mono" disabled={!isWisdomWakuConnected || wisdomText.trim().length === 0}>
                    <Send size={16} className="mr-2" />
                    Submit Wisdom
                  </Button>
                </CardContent>
              </Card>

              {/* Wisdom List */}
              <Card className="shadow-sm border-border relative overflow-hidden">
                <CardHeader className="pb-3 border-b border-border bg-card">
                  <CardTitle className="text-lg font-mono">Recent Wisdom</CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-card">
                  <div className="h-[400px] overflow-y-auto overflow-x-hidden p-4 relative space-y-4">
                    {wisdoms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono">
                        <Lightbulb size={48} className="mb-3" />
                        <p>No wisdom yet. Be the first to share!</p>
                      </div>
                    ) : (
                      wisdoms.map((wis, index) => (
                        <div key={wis.id} className="p-3 bg-muted rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors">
                          <p className="text-sm font-mono text-foreground break-words">{wis.text}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-2 text-right">
                            — Anonymous at {wis.timestamp}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-scanline"></div>
              </Card>
            </>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
