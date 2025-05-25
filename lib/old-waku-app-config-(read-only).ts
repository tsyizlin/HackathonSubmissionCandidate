// lib/waku-app-config.ts

import protobuf from "protobufjs";
import { DecodedMessage } from "@waku/sdk";

// 1. Define a generic interface for Waku message configuration
export interface WakuMessageConfig<T = any> {
  messageName: string; // A unique name for this message type (e.g., "ConfessionMessage")
  contentTopic: string; // The Waku content topic for this message type
  protobufDefinition: protobuf.Type; // The Protobuf.js Type definition
  typescriptType: T; // A placeholder for the TypeScript interface
  processMessage: (wakuMessage: DecodedMessage) => T | null; // Function to decode raw Waku message
}

// 2. Define the TypeScript interface for your decoded Confession message
export interface WakuConfessionMessage {
  timestamp: number;
  sender: string;
  text: string;
}

// 3. Define the Protobuf message structure for ConfessionMessage
export const ConfessionMessageProtobuf = new protobuf.Type("ConfessionMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("sender", 2, "string"))
  .add(new protobuf.Field("text", 3, "string"));

// 4. Define the TypeScript interface for your decoded Wisdom message
export interface WakuWisdomMessage {
  timestamp: number;
  sender: string;
  text: string;
}

// 5. Define the Protobuf message structure for WisdomMessage
export const WisdomMessageProtobuf = new protobuf.Type("WisdomMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("sender", 2, "string"))
  .add(new protobuf.Field("text", 3, "string"));

// 6. Define your application's base Waku content topic
// This is now a base path, the full topic will be constructed dynamically
export const BASE_CONTENT_TOPIC_PREFIX = "/cypherconfess/1/";

// 7. Define dedicated store peers (optional but recommended for reliability)
export const DEDICATED_STORE_PEER = "/dns4/waku-42-1.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmV8y1exLbqWVQjytwsuTKXK4n3QvLUa4zAWF71nshejYo";

// 8. Implement a message processor function for ConfessionMessage
export const processWakuConfessionMessage = (
  wakuMessage: DecodedMessage
): WakuConfessionMessage | null => {
  if (!wakuMessage.payload) return null;
  try {
    const decodedMessage = ConfessionMessageProtobuf.decode(
      wakuMessage.payload
    ) as unknown as WakuConfessionMessage;
    // Ensure timestamp is a number, as protobuf.js might return Long for uint64
    return {
      ...decodedMessage,
      timestamp: Number(decodedMessage.timestamp),
    };
  } catch (decodeError) {
    console.error("Failed to decode WakuConfessionMessage:", decodeError);
    return null;
  }
};

// 9. Implement a message processor function for WisdomMessage
export const processWakuWisdomMessage = (
  wakuMessage: DecodedMessage
): WakuWisdomMessage | null => {
  if (!wakuMessage.payload) return null;
  try {
    const decodedMessage = WisdomMessageProtobuf.decode(
      wakuMessage.payload
    ) as unknown as WakuWisdomMessage;
    // Ensure timestamp is a number, as protobuf.js might return Long for uint64
    return {
      ...decodedMessage,
      timestamp: Number(decodedMessage.timestamp),
    };
  } catch (decodeError) {
    console.error("Failed to decode WakuWisdomMessage:", decodeError);
    return null;
  }
};

// 10. Define a default/example configuration for ConfessionMessage
// This is used for pre-populating the topic input.
export const ConfessionMessageConfig: WakuMessageConfig<WakuConfessionMessage> = {
  messageName: "ConfessionMessage",
  contentTopic: `${BASE_CONTENT_TOPIC_PREFIX}default/proto`, // Default topic
  protobufDefinition: ConfessionMessageProtobuf,
  typescriptType: {} as WakuConfessionMessage, // Placeholder for type inference
  processMessage: processWakuConfessionMessage,
};

// 11. Define a default/example configuration for WisdomMessage
export const WisdomMessageConfig: WakuMessageConfig<WakuWisdomMessage> = {
  messageName: "WisdomMessage",
  contentTopic: `${BASE_CONTENT_TOPIC_PREFIX}wisdom/proto`, // Default topic for wisdom
  protobufDefinition: WisdomMessageProtobuf,
  typescriptType: {} as WakuWisdomMessage, // Placeholder for type inference
  processMessage: processWakuWisdomMessage,
};

// 12. Export a function to create a ConfessionMessageConfig with a dynamic content topic
export function createConfessionMessageConfig(topic: string): WakuMessageConfig<WakuConfessionMessage> {
  return {
    messageName: "ConfessionMessage",
    contentTopic: topic,
    protobufDefinition: ConfessionMessageProtobuf,
    typescriptType: {} as WakuConfessionMessage,
    processMessage: processWakuConfessionMessage,
  };
}

// 13. Export a function to create a WisdomMessageConfig with a dynamic content topic
export function createWisdomMessageConfig(topic: string): WakuMessageConfig<WakuWisdomMessage> {
  return {
    messageName: "WisdomMessage",
    contentTopic: topic,
    protobufDefinition: WisdomMessageProtobuf,
    typescriptType: {} as WakuWisdomMessage,
    processMessage: processWakuWisdomMessage,
  };
}

// 14. Export a function that returns all Waku message configurations
// This is now dynamic based on the provided topic.
// For this specific use case, we'll only return one config based on user input.
// If you had multiple fixed message types, you'd list them here.
export function getWakuMessageConfigs(confessionTopic: string, wisdomTopic: string): WakuMessageConfig[] {
  return [
    createConfessionMessageConfig(confessionTopic),
    createWisdomMessageConfig(wisdomTopic),
  ];
}
