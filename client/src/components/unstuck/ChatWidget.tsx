'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, PhoneOff } from "lucide-react";
import { getDescription, getDomain } from '@/utils/siteMetadata';
import { useUnstuck } from '@/contexts/UnstuckContext';

export function ChatWidget() {
  const [isHovered, setIsHovered] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getContext } = useUnstuck();
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  
  const handleHelp = async ({
    user_query,
    website_domain,
    website_description
  }) => {
    console.log("Getting context");
    const { interactiveElements, domString, screenshot } = await getContext();
    console.log(domString);

    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:8787/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userQuery: user_query,
          screenshot,
          domString,
          interactiveElements,
        }),
      });

      const data = await response.json();
      console.log("Analysis response:", data);
    } catch (error) {
      console.error("Error analyzing page:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Start the conversation with your agent
      await conversation.startSession({
        agentId: 'AI0TkDjXVHNFjPGSgHEZ',
        clientTools: {
          operateBrowser: handleHelp
        },
        dynamicVariables: {
          website_domain: getDomain(),
          website_description: getDescription()
        }
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="p-4 shadow-lg bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div 
            className={`
              w-12 h-12 relative rounded-full transition-all duration-500
              bg-gradient-to-br from-blue-400 to-blue-600
              ${conversation.status === 'connected' && !conversation.isSpeaking 
                ? "shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400" 
                : "shadow-sm"}
            `}
          >
            <img
              src="/elevenlabs-icon.svg"
              alt="ElevenLabs Icon"
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-col">
              <h3 className="font-semibold">Need help?</h3>
              {conversation.status === 'connected' && (
                <p className="text-sm text-muted-foreground">
                  {conversation.isSpeaking ? 'Agent is speaking...' : 'Agent is listening...'}
                </p>
              )}
            </div>
            <Button
              onClick={conversation.status === 'connected' ? stopConversation : startConversation}
              variant={conversation.status === 'connected' ? 'destructive' : 'default'}
              size="sm"
              className={`
                gap-2 transition-all duration-200
                ${conversation.status === 'connected' 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-zinc-900 hover:bg-zinc-800 text-white"}
              `}
            >
              {conversation.status === 'connected' ? (
                <>
                  <PhoneOff className="h-4 w-4" />
                  End call
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Voice chat
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 