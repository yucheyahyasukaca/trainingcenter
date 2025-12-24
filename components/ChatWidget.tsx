"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";

type Message = {
    role: "user" | "model";
    content: string;
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "model",
            content: "Halo! Saya Garuda AI. Ada yang bisa saya bantu terkait masalah teknis?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages, // Send history for context
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages((prev) => [
                ...prev,
                { role: "model", content: data.reply },
            ]);
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "model",
                    content: error.message || "Maaf, terjadi kesalahan. Silakan coba lagi nanti atau hubungi support manual.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="pointer-events-auto mb-4 w-[calc(100vw-3rem)] sm:w-[380px] h-[500px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm flex items-center gap-1">
                                        Garuda AI Support
                                        <Sparkles className="w-3 h-3 text-yellow-300" />
                                    </h3>
                                    <p className="text-indigo-100 text-xs">Online & Siap Membantu</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm break-words ${msg.role === "user"
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                                            }`}
                                    >
                                        {msg.role === "model" ? (
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>li]:mb-0.5 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                        <span className="text-xs text-slate-500">Sedang mengetik...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Tulis kendala Anda..."
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && ( // Hide button when open (optional, or keep it to toggle) - keeping separate logic
                <motion.button
                    onClick={() => setIsOpen(true)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl shadow-indigo-500/30 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 group-hover:opacity-100 opacity-0 transition-opacity" />
                    <MessageCircle className="w-7 h-7 relative z-10" />

                    {/* Notification Dot (Optional visual flair) */}
                    <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 border-2 border-indigo-600 rounded-full animate-pulse" />
                </motion.button>
            )}
        </div>
    );
}
