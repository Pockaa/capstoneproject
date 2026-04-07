import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { sendChatMessage, refreshChatContext } from '../../../../utils/ai/chatbot';
import { isAIConfigured } from '../../../../services/openrouter';
import { MarkdownText } from '../../../../components/MarkdownText';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: string;
}

export function AIChatbot() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setIsConfigured(isAIConfigured());
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
      easing: isOpen ? Easing.out(Easing.back(1.2)) : Easing.in(Easing.quad),
    }).start();
  }, [isOpen]);

  const toggleChat = () => {
    // Pulse animation
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (!isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm **SiteTrack AI**, your construction management assistant.\n\nI can help you with:\n• 📊 Project status and predictions\n• 📅 Schedule and task insights\n• 📦 Inventory questions\n• 📋 Report summaries\n• 👷 Team information\n\nAsk me anything about your projects!`,
        timestamp: new Date(),
      }]);
    }
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Build conversation history for context
      const history = messages
        .filter(m => m.role !== 'system' && m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const response = await sendChatMessage(text, history);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.success
          ? response.message
          : `❌ ${response.error || 'Failed to get a response.'}`,
        timestamp: new Date(),
        context: response.context,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${err?.message || 'Something went wrong.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const quickPrompts = [
    'Which projects are behind?',
    'Summarize today\'s reports',
    'What materials are low?',
    'Show schedule risks',
  ];

  // Chat panel dimensions
  const chatHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 520],
  });
  const chatOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Chat Panel */}
      <Animated.View
        style={[
          styles.chatPanel,
          { height: chatHeight, opacity: chatOpacity },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <View style={styles.chatAiIcon}>
              <MaterialCommunityIcons name="robot" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.chatHeaderTitle}>SiteTrack AI</Text>
              <Text style={styles.chatHeaderSub}>
                {isConfigured ? 'Online • Ask anything' : '⚠️ API key not configured'}
              </Text>
            </View>
          </View>
          <View style={styles.chatHeaderActions}>
            <TouchableOpacity
              onPress={() => {
                refreshChatContext();
                setMessages(prev => [...prev, {
                  id: `sys-${Date.now()}`,
                  role: 'system',
                  content: '🔄 Data context refreshed.',
                  timestamp: new Date(),
                }]);
              }}
              style={styles.headerActionBtn}
            >
              <Feather name="refresh-cw" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleChat} style={styles.headerActionBtn}>
              <Feather name="minus" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble
                : msg.role === 'system' ? styles.systemBubble
                : styles.aiBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.aiMsgIcon}>
                  <MaterialCommunityIcons name="robot" size={12} color="#8b5cf6" />
                </View>
              )}
              {msg.role === 'assistant' ? (
                <MarkdownText
                  style={styles.aiMsgText}
                  isDark={isDark}
                >
                  {msg.content}
                </MarkdownText>
              ) : (
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userMsgText : styles.systemMsgText,
                ]}>
                  {msg.content}
                </Text>
              )}
              {msg.context && (
                <Text style={styles.contextText}>{msg.context}</Text>
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}

          {/* Quick prompts (show only at start) */}
          {messages.length <= 1 && !loading && isConfigured && (
            <View style={styles.quickPromptsSection}>
              <Text style={styles.quickPromptsLabel}>Try asking:</Text>
              {quickPrompts.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickPromptBtn}
                  onPress={() => {
                    setInput(prompt);
                    setTimeout(() => sendMessage(), 50);
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="send" size={12} color="#8b5cf6" />
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={isConfigured ? 'Ask about your projects...' : 'Configure API key first'}
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            editable={isConfigured}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, (!input.trim() || loading || !isConfigured) && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading || !isConfigured}
          >
            <Feather name="send" size={16} color={input.trim() && !loading ? '#fff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* FAB Button */}
      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <TouchableOpacity
          style={[styles.fab, isOpen && styles.fabActive]}
          onPress={toggleChat}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isOpen ? 'close' : 'robot'}
            size={24}
            color="#fff"
          />
          {!isOpen && !isConfigured && (
            <View style={styles.fabWarning}>
              <Text style={styles.fabWarningText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      zIndex: 1000,
      alignItems: 'flex-end',
      gap: 12,
      ...Platform.select({
        web: { position: 'fixed' as any },
      }),
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: '#8b5cf6',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    fabActive: {
      backgroundColor: '#6d28d9',
      borderRadius: 28,
    },
    fabWarning: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#f59e0b',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabWarningText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#fff',
    },
    chatPanel: {
      width: 380,
      maxWidth: '90vw' as any,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 },
      }),
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
      backgroundColor: isDark ? '#0f172a' : '#faf5ff',
    },
    chatHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    chatAiIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: '#8b5cf6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatHeaderTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    chatHeaderSub: {
      fontSize: 11,
      color: isDark ? '#64748b' : '#94a3b8',
      marginTop: 1,
    },
    chatHeaderActions: {
      flexDirection: 'row',
      gap: 4,
    },
    headerActionBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 12,
      gap: 8,
    },
    messageBubble: {
      maxWidth: '85%',
      borderRadius: 12,
      padding: 10,
      paddingHorizontal: 14,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: '#8b5cf6',
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    systemBubble: {
      alignSelf: 'center',
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      borderRadius: 8,
      paddingVertical: 6,
    },
    aiMsgIcon: {
      position: 'absolute',
      top: -6,
      left: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#ede9fe',
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageText: {
      fontSize: 13,
      lineHeight: 19,
    },
    userMsgText: {
      color: '#fff',
    },
    aiMsgText: {
      color: isDark ? '#e2e8f0' : '#1e293b',
    },
    systemMsgText: {
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: 11,
      textAlign: 'center',
    },
    contextText: {
      fontSize: 9,
      color: isDark ? '#4b5563' : '#cbd5e1',
      marginTop: 4,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typingText: {
      fontSize: 12,
      color: '#8b5cf6',
      fontWeight: '500',
    },
    quickPromptsSection: {
      marginTop: 8,
      gap: 6,
    },
    quickPromptsLabel: {
      fontSize: 11,
      color: isDark ? '#64748b' : '#94a3b8',
      fontWeight: '600',
      marginBottom: 2,
    },
    quickPromptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? '#0f172a' : '#faf5ff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#ede9fe',
      borderRadius: 8,
      padding: 10,
    },
    quickPromptText: {
      fontSize: 12,
      color: isDark ? '#e2e8f0' : '#475569',
      fontWeight: '500',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#f1f5f9',
      gap: 8,
    },
    textInput: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      fontSize: 13,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#8b5cf6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
    },
  });
