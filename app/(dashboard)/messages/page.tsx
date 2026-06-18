'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Input, Avatar, Skeleton, Badge } from '@/components/ui';
import { Send, MessageSquare, Search } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import styles from './MessagesPage.module.css';

interface Participant {
  _id: string;
  displayName: string;
  photoURL?: string | null;
  role: string;
  isOnline: boolean;
}

interface ConversationItem {
  _id: string;
  participants: Participant[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job?: any;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
}

interface MessageItem {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    displayName: string;
    photoURL?: string | null;
  };
  text: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 5 seconds
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const loadConversations = useCallback(async (selectId?: string) => {
    try {
      setLoadingConv(true);
      const res = await apiClient<{ conversations: ConversationItem[] }>('/api/messages/conversations');
      if (res.data) {
        const convs = res.data.conversations;
        setConversations(convs);

        if (selectId) {
          const found = convs.find((c) => c._id === selectId);
          if (found) setActiveConversation(found);
        } else if (convs.length > 0 && !activeConversation) {
          setActiveConversation(convs[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  }, [activeConversation]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await apiClient<{ messages: MessageItem[] }>(`/api/messages/${convId}`);
      if (res.data) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversation) {
      setLoadingMsg(true);
      loadMessages(activeConversation._id).finally(() => setLoadingMsg(false));
      
      // Setup polling
      if (pollInterval.current) clearInterval(pollInterval.current);
      pollInterval.current = setInterval(() => {
        loadMessages(activeConversation._id);
      }, 5000);
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversation) return;

    setSending(true);
    try {
      const res = await apiClient<{ message: MessageItem }>(`/api/messages/${activeConversation._id}`, {
        method: 'POST',
        body: { text: newMessageText.trim() },
      });

      if (res.data) {
        setMessages((prev) => [...prev, res.data!.message]);
        setNewMessageText('');
        
        // Update last message in local conversation roster
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: res.data!.message.text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const getChatPartner = (conv: ConversationItem) => {
    return conv.participants.find((p) => p._id !== userProfile?._id) || {
      displayName: 'DIU Member',
      role: 'Member',
      isOnline: false,
      photoURL: null,
    };
  };

  return (
    <div className={styles.container}>
      <Card className={styles.inboxCard}>
        <div className={styles.inboxLayout}>
          
          {/* Conversation List Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Chats</h3>
            </div>
            
            <div className={styles.convList}>
              {loadingConv ? (
                <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton height="50px" />
                  <Skeleton height="50px" />
                  <Skeleton height="50px" />
                </div>
              ) : conversations.length === 0 ? (
                <div className={styles.emptyInbox}>
                  <MessageSquare size={36} style={{ opacity: 0.4 }} />
                  <p>No messages yet.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const partner = getChatPartner(conv);
                  const isActive = activeConversation?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      className={`${styles.convItem} ${isActive ? styles.convItemActive : ''}`}
                      onClick={() => setActiveConversation(conv)}
                    >
                      <Avatar
                        name={partner.displayName}
                        src={partner.photoURL || undefined}
                        size="md"
                        online={partner.isOnline}
                      />
                      <div className={styles.convInfo}>
                        <div className={styles.convHeader}>
                          <span className={styles.partnerName}>{partner.displayName}</span>
                          <span className={styles.convTime}>{timeAgo(conv.lastMessageAt)}</span>
                        </div>
                        <p className={styles.convText}>
                          {conv.lastMessage || 'Start conversation...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Pane */}
          <div className={styles.chatPane}>
            {activeConversation ? (
              <>
                {/* Chat Pane Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.partnerInfo}>
                    <Avatar
                      name={getChatPartner(activeConversation).displayName}
                      src={getChatPartner(activeConversation).photoURL || undefined}
                      size="md"
                      online={getChatPartner(activeConversation).isOnline}
                    />
                    <div>
                      <h4 className={styles.partnerHeaderName}>
                        {getChatPartner(activeConversation).displayName}
                      </h4>
                      <span className={styles.partnerHeaderRole}>
                        {getChatPartner(activeConversation).role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {activeConversation.job && (
                    <Badge variant="primary" className={styles.jobBadge}>
                      Job: {activeConversation.job.title}
                    </Badge>
                  )}
                </div>

                {/* Messages stream */}
                <div className={styles.messagesStream}>
                  {loadingMsg ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ alignSelf: 'flex-start', width: '45%' }}>
                        <Skeleton height="40px" width="100%" />
                      </div>
                      <div style={{ alignSelf: 'flex-end', width: '35%' }}>
                        <Skeleton height="40px" width="100%" />
                      </div>
                      <div style={{ alignSelf: 'flex-start', width: '50%' }}>
                        <Skeleton height="40px" width="100%" />
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className={styles.emptyMessages}>
                      <p>Send a message to start conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender._id === userProfile?._id;
                      return (
                        <div
                          key={msg._id}
                          className={`${styles.bubbleWrapper} ${isMe ? styles.bubbleMe : styles.bubblePartner}`}
                        >
                          <div className={styles.messageBubble}>
                            <p className={styles.messageText}>{msg.text}</p>
                            <span className={styles.messageTime}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendMessage} className={styles.chatInputForm}>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={sending}
                    className={styles.chatInput}
                  />
                  <Button type="submit" variant="primary" disabled={sending} className={styles.sendButton}>
                    <Send size={16} />
                  </Button>
                </form>
              </>
            ) : (
              <div className={styles.noActiveChat}>
                <MessageSquare size={64} style={{ color: 'var(--color-border)', marginBottom: '16px' }} />
                <h3>Select a Chat</h3>
                <p>Choose an active chat thread to view conversations and deliverables.</p>
              </div>
            )}
          </div>

        </div>
      </Card>
    </div>
  );
}
