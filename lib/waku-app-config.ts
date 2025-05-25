// lib/waku-app-config.ts
// 
// This file contains all the message type definitions and configurations for Waku integration.
// When modifying this app for your use case, this is one of the two main files to edit.
//
// MODIFICATION GUIDE:
// 1. Define your TypeScript message interface(s)
// 2. Implement message processor function(s)  
// 3. Create message configuration object(s)
// 4. Export factory functions for dynamic topics

import { DecodedMessage } from "@waku/sdk";

// =============================================================================
// CORE WAKU MESSAGE CONFIGURATION INTERFACE
// =============================================================================
// This interface defines the structure that every Waku message type must follow.
// You shouldn't need to modify this interface - it's the foundation for all message types.

export interface WakuMessageConfig<T = any> {
  messageName: string;        // Unique identifier for this message type (e.g., "ConfessionMessage")
  contentTopic: string;       // Waku content topic path (e.g., "/myapp/1/messages/json")
  typescriptType: T;          // TypeScript interface placeholder for type safety
  processMessage: (wakuMessage: DecodedMessage) => T | null;  // Decoder function
  serializeMessage: (message: T) => Uint8Array;  // JSON serializer function
}

// =============================================================================
// CONFESSION MESSAGE TYPE DEFINITION
// =============================================================================
// This section shows how to define a message type. Follow this pattern for your own message types.

// STEP 1: Define the TypeScript interface
// This describes the structure of your message data in TypeScript
export interface WakuConfessionMessage {
  timestamp: number;    // When the message was sent (Unix timestamp)
  sender: string;       // Unique identifier for the sender
  text: string;         // The actual confession content
}

// STEP 2: Define the JSON serializer function
// This converts TypeScript objects to JSON and then to Uint8Array for Waku
export const serializeConfessionMessage = (message: WakuConfessionMessage): Uint8Array => {
  const jsonString = JSON.stringify(message);
  return new TextEncoder().encode(jsonString);
};

// 4. Define the TypeScript interface for your decoded Wisdom message
export interface WakuWisdomMessage {
  timestamp: number;
  sender: string;
  text: string;
}

// 5. Define the JSON serializer function for WisdomMessage
export const serializeWisdomMessage = (message: WakuWisdomMessage): Uint8Array => {
  const jsonString = JSON.stringify(message);
  return new TextEncoder().encode(jsonString);
};

// 6. Define your application's base Waku content topic
// This is now a base path, the full topic will be constructed dynamically
// Changed from /proto to /json to reflect the new message format
export const BASE_CONTENT_TOPIC_PREFIX = "/cypherconfess/1/";

// 7. Define dedicated store peers (optional but recommended for reliability)
export const DEDICATED_STORE_PEER = "/dns4/waku-42-1.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmV8y1exLbqWVQjytwsuTKXK4n3QvLUa4zAWF71nshejYo";

// STEP 3: Implement the message processor function
// This function converts raw Waku messages into your TypeScript objects.
// The function name should be: process + YourMessageName
export const processWakuConfessionMessage = (
  wakuMessage: DecodedMessage
): WakuConfessionMessage | null => {
  // Always check if payload exists
  if (!wakuMessage.payload) return null;
  
  try {
    // Decode the JSON payload from Uint8Array
    const jsonString = new TextDecoder().decode(wakuMessage.payload);
    const decodedMessage = JSON.parse(jsonString) as WakuConfessionMessage;
    
    // Ensure timestamp is a number (JSON parsing should handle this correctly)
    return {
      ...decodedMessage,
      timestamp: Number(decodedMessage.timestamp),
    };
  } catch (decodeError) {
    // Log decode errors for debugging, but don't crash the app
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
    // Decode the JSON payload from Uint8Array
    const jsonString = new TextDecoder().decode(wakuMessage.payload);
    const decodedMessage = JSON.parse(jsonString) as WakuWisdomMessage;
    // Ensure timestamp is a number (JSON parsing should handle this correctly)
    return {
      ...decodedMessage,
      timestamp: Number(decodedMessage.timestamp),
    };
  } catch (decodeError) {
    console.error("Failed to decode WakuWisdomMessage:", decodeError);
    return null;
  }
};

// STEP 4: Create the message configuration object
// This ties everything together and provides a default content topic.
// The messageName must be unique across your entire application.
export const ConfessionMessageConfig: WakuMessageConfig<WakuConfessionMessage> = {
  messageName: "ConfessionMessage",                           // Unique identifier for this message type
  contentTopic: `${BASE_CONTENT_TOPIC_PREFIX}default/json`,  // Default content topic (changed to json)
  typescriptType: {} as WakuConfessionMessage,               // TypeScript type placeholder
  processMessage: processWakuConfessionMessage,              // Link to processor function
  serializeMessage: serializeConfessionMessage,              // Link to serializer function
};

// 11. Define a default/example configuration for WisdomMessage
export const WisdomMessageConfig: WakuMessageConfig<WakuWisdomMessage> = {
  messageName: "WisdomMessage",
  contentTopic: `${BASE_CONTENT_TOPIC_PREFIX}wisdom/json`,  // Default topic for wisdom (changed to json)
  typescriptType: {} as WakuWisdomMessage, // Placeholder for type inference
  processMessage: processWakuWisdomMessage,
  serializeMessage: serializeWisdomMessage,
};

// STEP 5: Create a factory function for dynamic topics
// This allows users to specify their own content topics at runtime.
// Always use this pattern for user-configurable topics.
export function createConfessionMessageConfig(topic: string): WakuMessageConfig<WakuConfessionMessage> {
  return {
    messageName: "ConfessionMessage",       // Keep the same messageName
    contentTopic: topic,                    // Use the dynamic topic provided
    typescriptType: {} as WakuConfessionMessage,
    processMessage: processWakuConfessionMessage,
    serializeMessage: serializeConfessionMessage,
  };
}

// 13. Export a function to create a WisdomMessageConfig with a dynamic content topic
export function createWisdomMessageConfig(topic: string): WakuMessageConfig<WakuWisdomMessage> {
  return {
    messageName: "WisdomMessage",
    contentTopic: topic,
    typescriptType: {} as WakuWisdomMessage,
    processMessage: processWakuWisdomMessage,
    serializeMessage: serializeWisdomMessage,
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
