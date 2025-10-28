import React, { useState } from "react";

type HistoryItem = {
  id: number;
  assistant: string;
  topic: string;
  platform: string;
  tone: string;
  output: string;
};

type Example = {
  title: string;
  topic: string;
  brandType: string;
  audience: string;
  tone: string;
};

const API_URL = "/api/generate";

export default function AIContentAssistant(): JSX.Element {
  const [assistant, setAssistant] = useState<string>("Zeus");
  const [topic, setTopic] = useState<string>("");
  const [brandType, setBrandType] = useState<string>("");
  const [audience, setAudience] = useState<string>("");
  const [tone, setTone] = useState<string>("professional");
  const [platform, setPlatform] = useState<string>("LinkedIn");
  const [model, setModel] = useState<string>("gemini-2.5-flash");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const examples: Example[] = [
    
    {
      title: "Wellness newsletter",
      topic: "5 morning habits for better mental health",
      brandType: "Wellness Coach",
      audience: "women 25-40",
      tone: "warm",
    },
  ];

  function buildPayload(): Record<string, unknown> {
    return {
      assistant,
      template: platform === "LinkedIn" ? "templates/blog_outline.txt" : "templates/social_caption.txt",
      brand_type: brandType || "Generic Brand",
      topic,
      audience: audience || "general audience",
      tone,
      system_json: `custom_instructions/${assistant.toLowerCase()}.json`,
      model,
      temperature,
      max_tokens: maxTokens,
    };
  }

  async function generateContent(): Promise<void> {
    setIsLoading(true);
    setError(null);
    setOutput("");

    if (!topic.trim()) {
      setError("Please provide a topic or product description.");
      setIsLoading(false);
      return;
    }

    const payload = buildPayload();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Server error: ${res.status} ${body}`);
      }

      const data: { output?: string; text?: string; raw?: string } = await res.json();
      const text = data.output ?? data.text ?? "";

      setOutput(text);
      setHistory((h) => [
        { id: Date.now(), assistant, topic, platform, tone, output: text || "(no output)" },
        ...h,
      ]);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function applyExample(ex: Example): void {
    setTopic(ex.topic);
    setBrandType(ex.brandType);
    setAudience(ex.audience);
    setTone(ex.tone);
  }

  async function copyOutput(): Promise<void> {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  }

  function downloadOutput(): void {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assistant.toLowerCase()}_${platform}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Content Assistant — Zeus & Crev</h1>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <section style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Assistant</label>
              <select value={assistant} onChange={(e) => setAssistant(e.target.value)} style={{ width: '100%', marginTop: 6 }}>
                <option>Zeus</option>
                <option>Crev</option>
              </select>
            </div>

            <div>
              <label>Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ width: '100%', marginTop: 6 }}>
                <option>LinkedIn</option>
                <option>Instagram</option>
                <option>X</option>
                <option>Blog</option>
                <option>Custom</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>Topic / Product Description</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} style={{ width: '100%', marginTop: 6 }} placeholder='Enter topic, product description, or idea' />
            </div>

            <div>
              <label>Brand Type</label>
              <input value={brandType} onChange={(e) => setBrandType(e.target.value)} style={{ width: '100%', marginTop: 6 }} placeholder='e.g., SaaS startup' />
            </div>

            <div>
              <label>Audience</label>
              <input value={audience} onChange={(e) => setAudience(e.target.value)} style={{ width: '100%', marginTop: 6 }} placeholder='e.g., founders' />
            </div>

            <div>
              <label>Tone</label>
              <input value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: '100%', marginTop: 6 }} placeholder='e.g., professional, playful' />
            </div>

            <div>
              <label>Model</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} style={{ width: '100%', marginTop: 6 }} />
            </div>

            <div>
              <label>Temperature</label>
              <input type='range' min='0' max='1' step='0.05' value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
              <div style={{ fontSize: 12, color: '#6B7280' }}>{temperature}</div>
            </div>

            <div>
              <label>Max Tokens</label>
              <input type='number' value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value || '0', 10))} style={{ width: '100%', marginTop: 6 }} />
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={generateContent} disabled={isLoading} style={{ padding: '8px 12px', background: '#4F46E5', color: '#fff', borderRadius: 6 }}>{isLoading ? 'Generating…' : 'Generate Content'}</button>
            <button onClick={() => { setTopic(''); setOutput(''); setError(null); }} style={{ padding: '8px 12px' }}>Clear</button>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280' }}>Tip: Use concise input for best results.</div>
          </div>

          {error && <div style={{ marginTop: 12, color: '#dc2626' }}>Error: {error}</div>}

          <div style={{ marginTop: 16 }}>
            <h3>Output</h3>
            <div style={{ marginTop: 8, background: '#F9FAFB', padding: 12, borderRadius: 6, minHeight: 120, whiteSpace: 'pre-wrap' }}>{output || <span style={{ color: '#9CA3AF' }}>Your generated content will appear here.</span>}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={copyOutput} style={{ padding: '6px 10px' }}>Copy</button>
              <button onClick={downloadOutput} style={{ padding: '6px 10px' }}>Download</button>
            </div>
          </div>
        </section>

        <aside>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 12, marginBottom: 12 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Examples</h4>
            {examples.map((ex) => (
              <div key={ex.title} style={{ marginBottom: 8, border: '1px solid #E5E7EB', padding: 8, borderRadius: 6 }}>
                <div style={{ fontWeight: 600 }}>{ex.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{ex.topic}</div>
                <div style={{ marginTop: 8 }}><button onClick={() => applyExample(ex)} style={{ padding: '6px 8px' }}>Apply</button></div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 12 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>History</h4>
            {history.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>No history yet.</div>}
            {history.map((h) => (
              <div key={h.id} style={{ marginBottom: 8, border: '1px solid #E5E7EB', padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{h.assistant} — {h.platform}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{h.topic}</div>
                <details style={{ marginTop: 8 }}><summary style={{ cursor: 'pointer' }}>View output</summary><div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{h.output}</div></details>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer style={{ marginTop: 24, textAlign: 'center', color: '#6B7280' }}>Built for prompt engineering demos — connect this UI to your backend that calls Gemini or Groq.</footer>
    </div>
  );
}
