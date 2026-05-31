import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { aiApi } from '../../../lib/services';
import { useAuth } from '../../../lib/auth';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function PatientChatPage() {
  const { user } = useAuth();
  const greeting = user
    ? `Hi ${user.firstName}! I'm your AI health assistant. How can I help you today?`
    : "Hi! I'm your AI health assistant. How can I help you today?";

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'ai', content: greeting, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const quickQuestions = [
    'Why do I have a headache?',
    'Is my blood pressure normal?',
    'Medication side effects',
    'Diet recommendations',
  ];

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      const res = await aiApi.chat({ message: content, sessionId });
      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'ai', content: res.reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Sorry, I could not reach the assistant. Please try again later.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-180px)] flex flex-col p-4">
      <Card className="flex-1 border-0 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#E6F0FA] to-[#E8F5E9]">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">AI Health Assistant</h2>
              <p className="text-xs text-gray-500">{sending ? 'Thinking...' : 'Always here to help'}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    message.type === 'user' ? 'bg-[#3A7BD5] text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-3 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {quickQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(q)}
                  className="rounded-xl text-xs whitespace-nowrap"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              disabled={sending}
              className="rounded-xl border-gray-200"
            />
            <Button onClick={handleSend} disabled={sending} className="bg-[#3A7BD5] hover:bg-[#2E6BC4] rounded-xl px-6">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
