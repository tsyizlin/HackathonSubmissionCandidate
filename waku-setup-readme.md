# Waku Integration Setup Guide

This guide explains how to modify the sample application to use Waku messaging for your own use case.

## Overview

The sample app demonstrates a confession/wisdom board where users can:
1. Connect to specific Waku content topics
2. Send messages to those topics  
3. Receive real-time messages from other users
4. View historical messages stored in Waku

## Key Files to Modify

When adapting this code for your use case, you'll primarily modify these two files:

### 1. `lib/waku-app-config.ts` - Message Types & Configuration
### 2. `pages/index.tsx` - UI Logic & Waku Integration

## Step-by-Step Modification Process

### Step 1: Define Your Message Types in `waku-app-config.ts`

```typescript
// 1. Define your TypeScript interface for messages
export interface YourCustomMessage {
  timestamp: number;
  sender: string;
  // Add your custom fields here
  customField: string;
  anotherField: number;
}

// 2. Define the Protobuf structure (must match TypeScript interface)
export const YourMessageProtobuf = new protobuf.Type("YourCustomMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("sender", 2, "string"))
  .add(new protobuf.Field("customField", 3, "string"))
  .add(new protobuf.Field("anotherField", 4, "uint32"));

// 3. Create a message processor function
export const processYourCustomMessage = (
  wakuMessage: DecodedMessage
): YourCustomMessage | null => {
  if (!wakuMessage.payload) return null;
  try {
    const decodedMessage = YourMessageProtobuf.decode(
      wakuMessage.payload
    ) as unknown as YourCustomMessage;
    return {
      ...decodedMessage,
      timestamp: Number(decodedMessage.timestamp),
    };
  } catch (decodeError) {
    console.error("Failed to decode YourCustomMessage:", decodeError);
    return null;
  }
};

// 4. Create a message configuration
export const YourMessageConfig: WakuMessageConfig<YourCustomMessage> = {
  messageName: "YourCustomMessage",
  contentTopic: "/yourapp/1/messages/proto", // Your default topic
  protobufDefinition: YourMessageProtobuf,
  typescriptType: {} as YourCustomMessage,
  processMessage: processYourCustomMessage,
};

// 5. Create a factory function for dynamic topics
export function createYourMessageConfig(topic: string): WakuMessageConfig<YourCustomMessage> {
  return {
    messageName: "YourCustomMessage",
    contentTopic: topic,
    protobufDefinition: YourMessageProtobuf,
    typescriptType: {} as YourCustomMessage,
    processMessage: processYourCustomMessage,
  };
}
```

### Step 2: Integrate Waku in Your UI (`pages/index.tsx`)

```typescript
// 1. Import your message types
import {
  YourCustomMessage,
  YourMessageConfig,
  createYourMessageConfig,
} from "@/lib/waku-app-config";

// 2. Set up state for your messages
const [messages, setMessages] = useState<YourCustomMessage[]>([]);
const [userContentTopic, setUserContentTopic] = useState<string>(YourMessageConfig.contentTopic);
const [isTopicSubmitted, setIsTopicSubmitted] = useState(false);

// 3. Set up the Waku hook with message handler
const { 
  isConnecting,
  isConnected,
  error,
  sendMessage,
  peerCount,
} = useWaku({
  wakuNodeUrl: "http://127.0.0.1:8645", // Not used for light node
  wakuNodeType: "light",
  onMessageReceived: useCallback((message: any, contentTopic: string) => {
    if (contentTopic === userContentTopic) {
      const customMessage = message as YourCustomMessage;
      console.log('Received new message:', customMessage);
      
      // Prevent duplicate messages
      const messageExists = messages.some(msg => 
        msg.timestamp === customMessage.timestamp && 
        msg.sender === customMessage.sender
      );
      if (messageExists) return;
      
      // Add to messages list
      setMessages(prev => [customMessage, ...prev]);
    }
  }, [messages, userContentTopic]),
  shouldConnect: isTopicSubmitted, // Only connect when user submits topic
  messageConfigs: isTopicSubmitted ? [createYourMessageConfig(userContentTopic)] : [],
});

// 4. Handle sending messages
const handleSendMessage = useCallback(async () => {
  if (!isConnected) return;
  
  const success = await sendMessage(
    { 
      customField: "your data here",
      anotherField: 42 
    }, 
    YourMessageConfig.messageName
  );
  
  if (success) {
    console.log("Message sent successfully");
  }
}, [isConnected, sendMessage]);
```

## Important Rules for Waku Integration

### ✅ DO:
- Always use `shouldConnect: true` only after the user has submitted a topic
- Handle message deduplication in `onMessageReceived`
- Use `useCallback` for the `onMessageReceived` handler
- Include dependencies in the `onMessageReceived` callback dependency array
- Wait for `isConnected: true` before sending messages
- Use the exact `messageName` from your config when sending

### ❌ DON'T:
- Connect immediately on component mount
- Forget to prevent duplicate messages
- Send messages before connection is established
- Modify the message configs array reference unnecessarily
- Use different field names between TypeScript interface and Protobuf definition

## Message Flow Sequence

1. **User Input**: User enters a content topic
2. **Validation**: Validate topic format
3. **Connection**: Set `shouldConnect: true` and provide `messageConfigs`
4. **Waku Setup**: useWaku hook creates WakuClient with configs
5. **Historical Messages**: WakuClient queries historical messages automatically
6. **Live Messages**: WakuClient subscribes to live messages
7. **Message Processing**: Incoming messages are processed and UI updates
8. **Sending**: User can send messages via `sendMessage` function

## Content Topic Format

Waku content topics must follow this format:
```
/topic-name/version/subtopic/encoding
```

Examples:
- `/myapp/1/general/proto`
- `/chat/1/room-123/proto` 
- `/game/1/tic-tac-toe/proto`

## Common Pitfalls

1. **Early Connection**: Don't connect before user submits topic
2. **Message Duplication**: Always check for existing messages
3. **Timing Issues**: Wait for `isConnected` before sending
4. **Config Mismatches**: Ensure TypeScript and Protobuf fields match
5. **Topic Validation**: Validate content topic format before connecting

## Testing Your Integration

1. Open multiple browser tabs/windows
2. Connect all to the same content topic
3. Send messages from one tab
4. Verify messages appear in all other tabs
5. Refresh a tab and verify historical messages load

## Debugging Tips

- Check browser console for Waku connection logs
- Verify content topic format is correct
- Ensure all message fields are properly defined
- Test with different content topics to isolate issues
- Monitor network connectivity if connection fails
