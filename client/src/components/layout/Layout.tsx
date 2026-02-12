import React, { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';
import ChatbotWidget from '../ai/ChatbotWidget';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showChatbot, setShowChatbot] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* Floating Chatbot Button */}
      <button
        className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white rounded-full shadow-lg p-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
        onClick={() => setShowChatbot((v) => !v)}
        aria-label="Open Legal Co-Pilot Chatbot"
      >
        <span role="img" aria-label="chat">💬</span>
      </button>
      {showChatbot && <ChatbotWidget onClose={() => setShowChatbot(false)} />}
    </div>
  );
};
