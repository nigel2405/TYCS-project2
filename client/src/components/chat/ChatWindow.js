import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/api';
import GlassCard from '../common/GlassCard';
import GlassButton from '../common/GlassButton';

const ChatWindow = ({ sessionId, socket, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMessages();
    }, [sessionId]);

    useEffect(() => {
        if (socket) {
            socket.on('receive-message', (message) => {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            });
        }

        return () => {
            if (socket) {
                socket.off('receive-message');
            }
        };
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/sessions/${sessionId}/messages`);
            setMessages(res.data.data.messages || []);
            setLoading(false);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Optimistic update (optional, but waiting for server/socket is safer for consistency)
            // For now, let's rely on the socket event or API response

            await axios.post(`/sessions/${sessionId}/messages`, {
                content: newMessage
            });

            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message');
        }
    };

    return (
        <GlassCard className="h-[500px] flex flex-col p-4">
            <div className="border-b border-white/10 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white">Live Chat</h3>
                <p className="text-white/50 text-xs">Communication is encrypted</p>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {loading ? (
                    <p className="text-center text-white/50">Loading chat...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-white/50 mt-20">No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender._id === user.id || msg.sender === user.id;
                        return (
                            <div
                                key={msg._id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe
                                            ? 'bg-primary-500 text-white rounded-br-none'
                                            : 'bg-white/10 text-white rounded-bl-none'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <span className="text-[10px] text-white/40">
                                        {isMe ? 'You' : msg.sender.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <GlassButton type="submit" variant="primary" disabled={!newMessage.trim()}>
                    Send
                </GlassButton>
            </form>
        </GlassCard>
    );
};

export default ChatWindow;
