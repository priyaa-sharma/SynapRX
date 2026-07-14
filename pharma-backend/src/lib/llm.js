const MODEL = 'llama-3.3-70b-versatile';
const RELEVANCE_THRESHOLD = 0.12;

export async function generateAnswer(question, retrieved) {
  const relevant = retrieved.filter((r) => r.score >= RELEVANCE_THRESHOLD);

  const citations = relevant.map((r) => ({
    label: `${r.doc.drug_name ? `${r.doc.drug_name} — ` : ''}${r.doc.category}`,
    source: r.doc.source,
  }));

  if (!process.env.GROQ_API_KEY) {
    if (relevant.length === 0) {
      return {
        text: "I can chat generally once GROQ_API_KEY is set on the backend — right now I can only answer questions that match something in the drug graph.",
        citations: [],
      };
    }
    return {
      text: relevant[0].doc.content,
      citations: [citations[0]],
      note: 'Generated without an LLM synthesis step — set GROQ_API_KEY to enable full conversational answers.',
    };
  }

  const context = relevant.length
    ? relevant
        .map((r, i) => `[${i + 1}] (${r.doc.category}${r.doc.drug_name ? `, ${r.doc.drug_name}` : ''}): ${r.doc.content}`)
        .join('\n')
    : null;

  const systemPrompt = context
    ? `You are SynapRX's assistant. You can chat normally about anything, but for pharmacology questions, ground your answer in the numbered context below when it's relevant — don't contradict it. Don't give dosing advice. Keep answers concise.\n\nContext:\n${context}`
    : `You are SynapRX's assistant. Chat normally and helpfully about anything. For pharmacology questions where you don't have specific context, answer from general knowledge but note that it isn't sourced from the local drug graph. Don't give dosing advice. Keep answers concise.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return { text, citations };
  } catch (err) {
    console.error('LLM generation failed:', err.message);
    if (relevant.length > 0) {
      return {
        text: relevant[0].doc.content,
        citations: [citations[0]],
        note: `LLM call failed (${err.message}) — showing the best-matching retrieved chunk instead.`,
      };
    }
    return {
      text: `Something went wrong talking to Groq: ${err.message}`,
      citations: [],
    };
  }
}
