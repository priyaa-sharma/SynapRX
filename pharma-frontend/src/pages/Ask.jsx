import { useState } from 'react';
import { askQuestion } from '../api/client';

export default function Ask() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask about a drug\'s mechanism, or ask why two drugs interact. Answers are grounded in the live drug graph, with sources cited below each response.',
      citations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const question = input;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setSending(true);
    try {
      const answer = await askQuestion(question);
      setMessages((prev) => [...prev, { role: 'assistant', text: answer.text, citations: answer.citations, note: answer.note }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Couldn't reach the backend (${err.message}).`, citations: [] },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 640 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>Ask</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Grounded in the live drug graph</p>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--surface-2)' : 'transparent',
              borderRadius: 12,
              padding: m.role === 'user' ? '10px 14px' : 0,
            }}
          >
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
            {m.note && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>{m.note}</p>
            )}
            {m.citations && m.citations.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {m.citations.map((c, j) => (
                  <span
                    key={j}
                    style={{
                      fontSize: 11,
                      color: 'var(--accent-text)',
                      border: '0.5px solid var(--border-strong)',
                      borderRadius: 'var(--radius)',
                      padding: '3px 9px',
                    }}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Thinking…</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '0.5px solid var(--border)', marginTop: 14 }}>
        <input
          type="text"
          placeholder="Ask about mechanisms, interactions, metabolism..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1 }}
        />
        <button onClick={handleSend} disabled={sending}>Send</button>
      </div>
    </div>
  );
}
