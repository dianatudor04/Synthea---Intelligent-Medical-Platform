import { useState } from 'react';
import { Brain, Send, Lightbulb, FileText, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { aiApi } from '../../lib/services';
import { useAuth } from '../../lib/auth';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function AIAssistantPage() {
  const { user } = useAuth();
  const greeting = user?.role === 'DOCTOR'
    ? `Hello Dr. ${user.lastName}! I can help with diagnostic suggestions, document analysis, and patient insights. How can I assist?`
    : "Hello! I'm your AI medical assistant. How can I assist you today?";

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'ai', content: greeting, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const suggestions = [
    'Suggest treatment plan for hypertension',
    'Review patient medication interactions',
    'Generate patient summary report',
    'What are common causes of fatigue?',
  ];

  const aiFeatures = [
    { icon: Lightbulb, title: 'Diagnostic Suggestions', description: 'AI-powered differential diagnosis based on symptoms', color: 'bg-[#FFF3E0] text-[#FF9800]' },
    { icon: FileText, title: 'Document Analysis', description: 'Extract key insights from medical records', color: 'bg-[#E6F0FA] text-[#3A7BD5]' },
    { icon: TrendingUp, title: 'Patient Trends', description: 'Identify patterns in patient health data', color: 'bg-[#E8F5E9] text-[#4CAF50]' },
    { icon: Clock, title: 'Time Optimization', description: 'Optimize scheduling and workflow efficiency', color: 'bg-[#F3E5F5] text-[#9C27B0]' },
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
        { id: (Date.now() + 1).toString(), type: 'ai', content: 'Could not reach the assistant. Please try again later.', timestamp: new Date() },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">AI Assistant</h1>
            <p className="text-gray-500">Intelligent medical support powered by AI</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-[#E6F0FA] to-[#E8F5E9]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#3A7BD5]" />
                <h2 className="font-semibold text-gray-800">AI Chat</h2>
                <Badge className="bg-white text-[#3A7BD5] border-0 ml-auto">{sending ? 'Thinking...' : 'Active'}</Badge>
              </div>
            </div>

            <ScrollArea className="h-[400px] lg:h-[500px] p-4 lg:p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 ${
                        message.type === 'user' ? 'bg-[#3A7BD5] text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm lg:text-base whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 lg:p-6 border-t border-gray-100">
              <div className="mb-4 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {suggestions.map((s, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputValue(s)}
                      className="rounded-xl text-xs whitespace-nowrap"
                    >
                      {s}
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

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">AI Capabilities</h3>
            {aiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-4 border-0 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`${feature.color} p-2 rounded-xl flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">{feature.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9]">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#3A7BD5] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800 text-sm mb-2">Pro Tip</h4>
                <p className="text-xs text-gray-600">
                  Sessions are persisted server-side, so you can pick up where you left off.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
