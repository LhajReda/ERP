import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/stores/auth.store';
import { chatAPI } from '../src/services/api';
import { colors, spacing, fontSize, borderRadius } from '../src/theme/colors';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentEmoji?: string;
  agentName?: string;
}

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { currentFarmId } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const conversationId = useRef(`conv-${Date.now()}`);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: `msg-${Date.now()}`, role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAPI.send({
        message: userMsg.content,
        conversationId: conversationId.current,
        farmId: currentFarmId || '',
        locale: i18n.language,
      });
      const data = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-res`,
          role: 'assistant',
          content: data.message,
          agentEmoji: data.agentUsed?.emoji,
          agentName: data.agentUsed?.name,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: 'assistant', content: 'Erreur de connexion. Réessayez.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.role === 'user' ? styles.msgRight : styles.msgLeft]}>
      <View style={[styles.msgBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
        {item.agentEmoji && (
          <View style={styles.agentTag}>
            <Text style={styles.agentEmoji}>{item.agentEmoji}</Text>
            <Text style={styles.agentName}>{item.agentName}</Text>
          </View>
        )}
        <Text style={[styles.msgText, item.role === 'user' && { color: colors.white }]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('chat.title'),
          headerStyle: { backgroundColor: colors.primary[500] },
          headerTintColor: colors.white,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>🤖</Text>
              <Text style={styles.emptyChatText}>{t('chat.title')}</Text>
              <Text style={styles.emptyChatSub}>
                Posez vos questions sur l'agriculture, la finance, le stock...
              </Text>
            </View>
          }
        />

        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.typingText}>Réflexion en cours...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.gray[400]}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  messageList: { padding: spacing.md, flexGrow: 1 },
  msgRow: { marginBottom: spacing.sm },
  msgRight: { alignItems: 'flex-end' },
  msgLeft: { alignItems: 'flex-start' },
  msgBubble: { maxWidth: '80%', borderRadius: borderRadius.xl, padding: spacing.md },
  userBubble: { backgroundColor: colors.primary[500], borderBottomRightRadius: borderRadius.sm },
  assistantBubble: { backgroundColor: colors.white, borderBottomLeftRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.gray[200] },
  agentTag: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  agentEmoji: { fontSize: 14 },
  agentName: { fontSize: fontSize.xs, color: colors.gray[500], marginLeft: 4 },
  msgText: { fontSize: fontSize.md, color: colors.gray[800], lineHeight: 22 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyChatEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyChatText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[700] },
  emptyChatSub: { fontSize: fontSize.md, color: colors.gray[400], textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, gap: spacing.sm },
  typingText: { fontSize: fontSize.sm, color: colors.gray[500] },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.gray[200], backgroundColor: colors.white,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: fontSize.md, maxHeight: 100, color: colors.gray[800],
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[500],
    justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: colors.white, fontSize: 20, fontWeight: '700' },
});
