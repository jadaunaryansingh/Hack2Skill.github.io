import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { Bot, Send, Zap, RefreshCw } from 'lucide-react';
import './AssistantPage.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Suggest best logistics strategy",
  "What's the current risk landscape?",
  "How can I reduce logistics costs?",
  "Analyze delay patterns",
  "What if Delhi-Mumbai route fails?",
  "Optimize my fleet deployment",
];

// Typewriter effect hook
function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

function AssistantMessage({ content, isLatest }: { content: string; isLatest: boolean }) {
  const text = isLatest ? useTypewriter(content, 8) : content;
  return <div className="msg-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} />;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/g, '<tr><td>$1</td><td>$2</td><td>$3</td><td>$4</td></tr>')
    .replace(/^\|\s*[-:]+\s*\|.*$/gm, '')
    .replace(/^(#{1,3})\s+(.+)$/gm, (_, h, t) => `<h${h.length+2}>${t}</h${h.length+2}>`)
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '');
}

export default function AssistantPage() {
  const [messages, setMessages]   = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: '**Welcome to SmartChain AI Assistant** 🤖\n\nI\'m your intelligent supply chain advisor. I can help you:\n\n- **Optimize routes** and fleet deployment\n- **Predict disruptions** before they cascade\n- **Reduce logistics costs** with AI recommendations\n- **Simulate failure scenarios** for resilience planning\n\nHow can I help you today? Try one of the quick prompts below or ask your own question.',
    timestamp: new Date(),
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryAssistant(text);
      const aiMsg: Message = {
        id: (Date.now()+1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date(),
      };
      setMessages(m => [...m, aiMsg]);
    } catch (e) {
      setMessages(m => [...m, {
        id: (Date.now()+1).toString(), role: 'assistant',
        content: '⚠️ Unable to reach AI backend. Please ensure the FastAPI server is running on port 8000.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  const latestAiMsgId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  return (
    <div className="assistant-page">
      {/* Header */}
      <div className="assistant-header glass-card">
        <div className="assistant-header-left">
          <div className="assistant-avatar">
            <Bot size={22} />
          </div>
          <div>
            <div className="assistant-title">SmartChain AI Assistant</div>
            <div className="assistant-subtitle">Powered by Supply Chain Intelligence Engine v2.4</div>
          </div>
        </div>
        <div className="assistant-status">
          <span className="pulse-dot green" />
          <span>AI Online</span>
          <span className="badge badge-purple"><Zap size={10} /> 95% Confidence</span>
        </div>
      </div>

      {/* Chat window */}
      <div className="chat-window glass-card scroll-y">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar"><Bot size={14} /></div>
            )}
            <div className="msg-bubble">
              {msg.role === 'assistant' ? (
                <AssistantMessage content={msg.content} isLatest={msg.id === latestAiMsgId} />
              ) : (
                <div className="msg-content">{msg.content}</div>
              )}
              <div className="msg-time">
                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="msg-avatar"><Bot size={14} /></div>
            <div className="msg-bubble">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="quick-prompts">
        {QUICK_PROMPTS.map(p => (
          <button key={p} className="quick-prompt-btn" onClick={() => send(p)}>
            <Zap size={11} /> {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-wrap glass-card">
        <input
          id="assistant-input"
          className="chat-input"
          placeholder="Ask SmartChain AI anything about your supply chain..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          disabled={loading}
        />
        <button
          id="assistant-send-btn"
          className="btn btn-primary chat-send"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
