"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };
type ConversationSummary = { id: string; title: string | null; createdAt: string };

const SUGGESTED_QUESTIONS = [
  "¿Cuánto debería invertir este mes?",
  "¿Estoy gastando demasiado?",
  "¿Cómo puedo alcanzar mi objetivo más rápido?",
  "¿Estoy diversificado?",
];

export function AiChat({ initialConversations }: { initialConversations: ConversationSummary[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation(id: string) {
    setConversationId(id);
    setError(null);
    const res = await fetch(`/api/ai/chat?conversationId=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, conversationId }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo obtener respuesta. Comprueba la configuración de la IA.");
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);

    if (!conversationId) {
      setConversationId(data.conversationId);
      setConversations((prev) => [{ id: data.conversationId, title: question.slice(0, 60), createdAt: new Date().toISOString() }, ...prev]);
    }
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-5 h-[70vh]">
      {/* Historial */}
      <div className="card p-3 hidden lg:flex lg:flex-col">
        <button onClick={startNewConversation} className="btn-secondary w-full mb-3 justify-start">
          <i className="ti ti-plus text-base" aria-hidden="true" />
          Nueva conversación
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-ink-600 dark:text-mist-400 px-2 py-4 text-center">Sin conversaciones aún.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs truncate transition-colors ${
                  conversationId === c.id
                    ? "bg-mist-200/60 dark:bg-ink-700 text-ink-900 dark:text-mist-100 font-medium"
                    : "text-ink-600 dark:text-mist-400 hover:bg-mist-100 dark:hover:bg-ink-800"
                }`}
              >
                {c.title || "Conversación"}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="card flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-10 h-10 rounded-full bg-wealth-100 dark:bg-wealth-500/10 flex items-center justify-center mb-3">
                <i className="ti ti-sparkles text-wealth-500 text-lg" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium mb-1">Pregunta lo que quieras sobre tus finanzas</p>
              <p className="text-xs text-ink-600 dark:text-mist-400 mb-4 max-w-xs">
                Uso solo tus datos reales guardados en la app — nunca invento cifras.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-mist-200 dark:border-ink-700 text-ink-600 dark:text-mist-400 hover:border-wealth-500 hover:text-wealth-500 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900"
                    : "bg-mist-100 dark:bg-ink-800 text-ink-900 dark:text-mist-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-mist-100 dark:bg-ink-800 rounded-xl px-4 py-2.5 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-mist-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-mist-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-mist-400 animate-bounce" />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-signal-red text-center">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="border-t border-mist-100 dark:border-ink-700 p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="field-input flex-1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-accent px-4">
            <i className="ti ti-send text-base" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
