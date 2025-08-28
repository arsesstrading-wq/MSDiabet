
import React, { useState, useEffect, useRef } from 'react';
import type { View, User } from '../types';
import Header from './Header';
import { GeminiIcon } from './Icons';
import { startChat, getChatbotResponse } from '../services/geminiService';
import type { Chat } from '@google/genai';
import type { strings } from '../localization/strings';

interface ChatbotScreenProps {
  setView: (view: View) => void;
  currentUser: User;
  t: (key: keyof typeof strings.fa) => string;
}

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ setView, currentUser, t }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the chat session when the component mounts
    const chatInstance = startChat(currentUser);
    setChat(chatInstance);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat || isLoading) return;

    const userMessage = { text: input, sender: 'user' as 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiResponseText = await getChatbotResponse(chat, input);
    const aiMessage = { text: aiResponseText, sender: 'ai' as 'ai' };
    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('healthChatbot')} onBack={() => setView('aiTools')} />
      <div className="flex-grow p-4 overflow-y-auto" ref={messagesEndRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && <GeminiIcon isActive className="h-6 w-6 flex-shrink-0" />}
              <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-lg'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-end gap-2 justify-start">
                <GeminiIcon isActive className="h-6 w-6 flex-shrink-0" />
                <div className="max-w-xs p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-lg">
                    <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('askMeAnything')}
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button onClick={handleSend} disabled={isLoading} className="bg-primary-600 text-white p-3 rounded-full shadow-md hover:bg-primary-700 disabled:bg-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotScreen;
