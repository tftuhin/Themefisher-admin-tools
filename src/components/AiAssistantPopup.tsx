// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, X, ArrowUp, Paperclip, Loader2, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DownloadInvoiceCard } from "./chat/DownloadInvoiceCard";
import { DownloadExcelCard } from "./chat/DownloadExcelCard";

export function AiAssistantPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, status, error, sendMessage } = useChat({
    api: "/api/chat",
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Cmd+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!(input || "").trim()) return;

    sendMessage({
      role: "user",
      content: input,
    });
    setInput("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-700 shadow-lg shadow-slate-200/50 flex items-center gap-2 hover:border-violet-300 hover:text-violet-600 transition-all duration-300 z-50 group font-medium text-sm"
      >
        <img src="/chatbot-icon.jpg" alt="AI Icon" className="w-6 h-6 rounded-full object-cover" />
        Ask AI
        <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Click outside to close (simplified backdrop) */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header (Context Bar) */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
          <div className="flex items-center gap-2 text-violet-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide">TF Admin AI</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white min-h-[300px]">
          {(messages || []).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="p-4 bg-violet-50 rounded-full text-violet-500">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-sm max-w-sm text-center">
                I can help you generate invoices, parse MT103 PDFs, or process SCB Excel exports. What would you like to do?
              </p>
              
              {/* Suggestions */}
              <div className="mt-8 w-full max-w-md space-y-2">
                <div onClick={() => { setInput("Generate an invoice for the attached MT103"); }} className="w-full flex items-center gap-3 p-3 text-sm text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                  <ArrowRight className="w-4 h-4 text-violet-400 group-hover:text-violet-600" />
                  <span>Generate an invoice from MT103 PDF</span>
                </div>
                <div onClick={() => { setInput("I want to create an SCB bulk Excel export"); }} className="w-full flex items-center gap-3 p-3 text-sm text-slate-600 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                  <ArrowRight className="w-4 h-4 text-violet-400 group-hover:text-violet-600" />
                  <span>Create SCB bulk Excel export</span>
                </div>
              </div>
            </div>
          ) : (
            (messages || []).map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    m.role === "user"
                      ? "bg-slate-100 text-slate-800"
                      : m.content || m.toolInvocations?.length
                        ? "bg-white border border-slate-100 text-slate-700 shadow-sm"
                        : "bg-transparent"
                  }`}
                >
                  {(m.content || (m.parts && m.parts.some(p => p.type === 'text'))) && (
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReactMarkdown>
                        {m.content || 
                          (m.parts ? m.parts.filter(p => p.type === 'text').map(p => p.text).join('') : '')}
                      </ReactMarkdown>
                    </div>
                  )}

                  {!(m.content || (m.parts && m.parts.some(p => p.type === 'text'))) && (!m.toolInvocations || m.toolInvocations.length === 0) && m.role !== "user" && (
                    <div className="flex gap-1 items-center h-5 px-2">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  )}
                  
                  {m.experimental_attachments && m.experimental_attachments.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                      <Paperclip className="w-3.5 h-3.5 text-violet-500" />
                      <span className="truncate max-w-[200px]">{m.experimental_attachments[0].name}</span>
                    </div>
                  )}

                  {/* Generative UI Components via Tool Invocations */}
                  {m.toolInvocations?.map((toolInvocation) => {
                    const { toolName, toolCallId, state, result } = toolInvocation;
                    
                    if (state !== 'result') {
                      return (
                        <div key={toolCallId} className="flex items-center gap-2 text-violet-500 mt-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-medium">
                            {toolName === 'get_database_context' && 'Checking database...'}
                            {toolName === 'create_client' && 'Creating client...'}
                            {toolName === 'create_vendor' && 'Creating vendor...'}
                            {toolName === 'prepare_invoice' && 'Preparing invoice...'}
                            {toolName === 'prepare_scb_excel' && 'Generating Excel...'}
                            {!['get_database_context', 'create_client', 'create_vendor', 'prepare_invoice', 'prepare_scb_excel'].includes(toolName) && 'Working...'}
                          </span>
                        </div>
                      );
                    }
                    
                    if (toolName === 'prepare_invoice' && result?.success) {
                      return (
                        <div key={toolCallId} className="mt-4">
                          <DownloadInvoiceCard 
                            invoice={result.invoice}
                            client={result.client}
                            paymentAccounts={result.paymentAccounts}
                          />
                        </div>
                      );
                    }

                    if (toolName === 'prepare_scb_excel' && result?.success) {
                      return (
                        <div key={toolCallId} className="mt-4">
                          <DownloadExcelCard 
                            filename={result.filename}
                            rows={result.rows}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="flex justify-center mt-2">
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100 max-w-[85%] text-center">
                {error.message || "An error occurred while communicating with the AI. Please try again."}
              </div>
            </div>
          )}

          {isLoading && !error && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                <span className="text-sm text-slate-500 font-medium">FinAgent is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleFormSubmit} className="relative flex items-center">
            <input
              value={input || ""}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or request a document..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-slate-400 shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !(input || "").trim()}
              className="absolute right-2.5 p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-3 flex justify-between px-2">
             <div className="text-[10px] text-slate-400 flex items-center gap-1">
               <Sparkles className="w-3 h-3" /> AI can make mistakes. Verify output.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
