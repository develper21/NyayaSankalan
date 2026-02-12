import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../api/axios';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: Array<{ source: string; score: number; id?: string }>;
}

const ChatbotWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hello! I am your Legal Co-Pilot. Ask me any legal question about your case documents.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiClient.post('/ai/chat', { q: userMsg.text, k: 3 });
      const answer = res.data?.answer || res.data?.data?.answer || 'Sorry, I could not find an answer.';
      const sources = res.data?.sources || [];
      setMessages((msgs) => [...msgs, { sender: 'bot', text: answer, sources }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: 'Sorry, there was an error contacting the AI service.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) sendMessage();
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 max-w-full bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col" style={{ height: 420 }}>
      <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-lg">
        <span className="font-semibold text-blue-700">Legal Co-Pilot</span>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-lg">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-white border'}`}>
              {msg.text}
              {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <div>Sources:</div>
                  <ul className="list-disc ml-4">
                    {msg.sources.map((s, i) => (
                      <li key={i}>{s.source} (score: {s.score.toFixed(2)})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t bg-white flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget;
