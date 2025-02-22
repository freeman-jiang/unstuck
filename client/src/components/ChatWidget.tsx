'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';
import Image from 'next/image';

export function ChatWidget() {
  const [isHovered, setIsHovered] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Start the conversation with your agent
      await conversation.startSession({
        agentId: 'AI0TkDjXVHNFjPGSgHEZ',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
        <div className="w-12 h-12 relative">
          <Image
            src="/elevenlabs-icon.svg"
            alt="ElevenLabs Icon"
            width={48}
            height={48}
            className="rounded-full"
            priority
          />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">Need help?</h3>
          <button
            onClick={conversation.status === 'connected' ? stopConversation : startConversation}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-white font-medium
              ${conversation.status === 'connected' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-black hover:bg-gray-800'}
              transition-colors duration-200
            `}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            {conversation.status === 'connected' ? 'End call' : 'Voice chat'}
          </button>
        </div>
      </div>
      {conversation.status === 'connected' && (
        <div className="bg-white rounded-lg shadow-md p-3 text-sm">
          {conversation.isSpeaking ? 'Agent is speaking...' : 'Agent is listening...'}
        </div>
      )}
    </div>
  );
} 