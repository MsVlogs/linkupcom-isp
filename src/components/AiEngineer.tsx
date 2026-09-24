'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp, Bot, ShieldCheck, Loader2 } from 'lucide-react';

type Props = { customerId: string; customerName: string };

type Diagnostic = {
  summary: string;
  findings: Array<{ level: 'info' | 'warning' | 'critical'; title: string; detail: string }>;
  nextChecks: string[];
  disclaimer: string;
};

export default function AiEngineer({ customerId, customerName }: Props) {
  const [question, setQuestion] = useState('Why is this customer offline?');
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const ask = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/ai-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Diagnostic failed');
      setDiagnostic(data);
    } catch (error) {
      setDiagnostic({
        summary: error instanceof Error ? error.message : 'Diagnostic failed',
        findings: [],
        nextChecks: [],
        disclaimer: 'No changes were made.',
      });
    } finally {
      setLoading(false);
    }
  };

  const rate = async (rating: 'up' | 'down') => {
    if (!diagnostic) return;
    setFeedback(rating);
    await fetch('/api/ai-engineer/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        question,
        rating,
        response: diagnostic.summary,
      }),
    });
  };

  return (
    <section className="bg-white rounded-lg border border-indigo-200 shadow-sm mt-6">
      <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2"><Bot className="h-5 w-5 text-indigo-600" /></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">BengalStack AI Engineer</h2>
            <p className="text-sm text-gray-500">Ask about {customerName}, billing, device status, or an outage.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          <ShieldCheck className="h-3.5 w-3.5" /> Read-only
        </span>
      </div>

      <div className="p-6">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Ask: why is this customer offline?"
          />
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ask
          </button>
        </div>

        {diagnostic && (
          <div className="mt-5 space-y-4">
            <div className="rounded-md bg-indigo-50 p-4">
              <p className="font-medium text-gray-900">{diagnostic.summary}</p>
            </div>

            <div className="space-y-2">
              {diagnostic.findings.map((finding, index) => (
                <div key={index} className="rounded-md border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{finding.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{finding.detail}</p>
                </div>
              ))}
            </div>

            {diagnostic.nextChecks.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900">Recommended checks</p>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-gray-600">
                  {diagnostic.nextChecks.map((item, index) => <li key={index}>{item}</li>)}
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-xs text-gray-500">{diagnostic.disclaimer}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => rate('up')} className={`rounded-md p-2 hover:bg-gray-100 ${feedback === 'up' ? 'bg-green-50 text-green-700' : 'text-gray-500'}`} aria-label="Good answer"><ThumbsUp className="h-4 w-4" /></button>
                <button onClick={() => rate('down')} className={`rounded-md p-2 hover:bg-gray-100 ${feedback === 'down' ? 'bg-red-50 text-red-700' : 'text-gray-500'}`} aria-label="Poor answer"><ThumbsDown className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}