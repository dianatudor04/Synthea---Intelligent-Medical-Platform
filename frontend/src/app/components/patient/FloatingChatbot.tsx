import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { aiApi, recommendationsApi, appointmentsApi, authApi } from '../../../lib/services';
import { trackEvent } from '../../../lib/events';
import type { GapOffer } from '../../../lib/types';

type Recommendation = {
  id: string;
  title: string;
  advice: string;
  basis: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};
type Message = { text?: string; sender: 'user' | 'bot'; rec?: Recommendation; offer?: GapOffer };

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FloatingChatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I'm your health assistant. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  // On each navigation, surface one proactive card in the balloon. A time-
  // sensitive discounted slot offer takes priority over a curated recommendation
  // (which we show verbatim — no LLM rephrasing → no hallucinated medical claim,
  // and acking it shares the cross-channel frequency cap with email).
  const shownRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) Discounted gap-fill offer?
        const { offer } = await appointmentsApi.gapOffer();
        if (cancelled) return;
        if (offer) {
          const key = `offer:${offer.doctorId}:${offer.slot}`;
          if (!shownRef.current.has(key)) {
            shownRef.current.add(key);
            setMessages((prev) => [...prev, { sender: 'bot', offer }]);
            setIsOpen(true);
            return; // one card per navigation
          }
        }
        // 2) Otherwise, a curated recommendation.
        const res = await recommendationsApi.pending();
        if (cancelled) return;
        const rec = res.data.find((r) => !shownRef.current.has(r.id));
        if (!rec) return;
        shownRef.current.add(rec.id);
        setMessages((prev) => [...prev, { sender: 'bot', rec }]);
        setIsOpen(true);
        recommendationsApi.ack(rec.id, 'BALLOON').catch(() => {});
      } catch {
        /* not a patient / no consent / offline — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  // One-tap booking of a discounted gap-fill slot. The server applies the
  // discount (it never trusts a client-sent price).
  const bookOffer = async (offer: GapOffer) => {
    setBookingSlot(offer.slot);
    try {
      const profile = await authApi.profile();
      const patientId = profile.patientProfile?.id;
      if (!patientId) throw new Error('no patient profile');
      await appointmentsApi.create({
        patientId,
        doctorId: offer.doctorId,
        scheduledAt: offer.slot,
        reason: 'Off-peak gap offer',
        applyGapDiscount: true,
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.offer?.slot !== offer.slot),
        {
          sender: 'bot',
          text: `✓ Booked! ${offer.doctorName} on ${formatSlot(offer.slot)} — ${offer.discountedFee} ${offer.currency} (${offer.discountPct}% off). See it under Appointments.`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I could not book that slot — it may have just been taken.' },
      ]);
    } finally {
      setBookingSlot(null);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: Message = { text: trimmed, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    try {
      const res = await aiApi.chat({ message: trimmed, sessionId });
      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { text: res.reply, sender: 'bot' }]);
      // Track that a chat message was sent (length only — never the content).
      trackEvent('chat_message', { length: trimmed.length, chatSessionId: res.sessionId });
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: 'Sorry, I could not reach the assistant right now. Please try again later.', sender: 'bot' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Health Assistant</h3>
                  <p className="text-xs text-white/80">{sending ? 'Thinking…' : 'Online'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) =>
                message.offer ? (
                  // Discounted gap-fill offer card.
                  <div key={index} className="flex justify-start">
                    <div className="max-w-[92%] rounded-2xl border border-[#FFE0B2] bg-[#FFF8F0] p-3">
                      <div className="flex items-center gap-1.5 mb-1 text-[#E65100]">
                        <CalendarClock className="w-4 h-4" />
                        <span className="text-xs font-semibold">Off-peak opening — special price</span>
                      </div>
                      <p className="text-sm text-gray-800">
                        {message.offer.doctorName} ({message.offer.specialty}) has an opening on{' '}
                        <span className="font-semibold">{formatSlot(message.offer.slot)}</span>. Book this quieter
                        slot and get <span className="font-semibold">{message.offer.discountPct}% off</span>.
                      </p>
                      <p className="text-sm mt-1">
                        <span className="text-gray-400 line-through">{message.offer.originalFee} {message.offer.currency}</span>{' '}
                        <span className="font-bold text-[#E65100]">{message.offer.discountedFee} {message.offer.currency}</span>
                      </p>
                      <button
                        onClick={() => bookOffer(message.offer!)}
                        disabled={bookingSlot === message.offer.slot}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#E65100] rounded-full px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
                      >
                        {bookingSlot === message.offer.slot && <Loader2 className="w-3 h-3 animate-spin" />}
                        Book {new Date(message.offer.slot).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {message.offer.discountPct}% off
                      </button>
                    </div>
                  </div>
                ) : message.rec ? (
                  // Curated recommendation card — advice text shown verbatim.
                  <div key={index} className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl border border-[#E6F0FA] bg-[#F5F9FE] p-3">
                      <div className="flex items-center gap-1.5 mb-1 text-[#3A7BD5]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold">A tip based on your records</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{message.rec.title}</p>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{message.rec.advice}</p>
                      {message.rec.basis && (
                        <p className="text-[11px] text-gray-400 mt-2 italic">Why: {message.rec.basis}</p>
                      )}
                      {message.rec.ctaUrl && (
                        <button
                          onClick={() => {
                            const url = message.rec!.ctaUrl!;
                            if (/^https?:\/\//i.test(url)) window.open(url, '_blank');
                            else navigate(url);
                            setIsOpen(false);
                          }}
                          className="mt-2 text-xs font-medium text-white bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] rounded-full px-3 py-1.5 hover:opacity-90"
                        >
                          {message.rec.ctaLabel || 'Learn more'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={sending}
                  className="flex-1 rounded-full"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] rounded-full shadow-xl flex items-center justify-center z-50 hover:shadow-2xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </motion.button>
    </>
  );
}
