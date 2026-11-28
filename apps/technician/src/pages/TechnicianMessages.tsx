import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TechnicianScreen from '../components/TechnicianScreen';

type Conversation = {
  id: string;
  sender: string;
  message: string;
  time: string;
  unread: boolean;
};

// Sample conversations until technician messaging is connected to Firebase.
const sampleConversations: Conversation[] = [
  {
    id: '1',
    sender: 'Dispatch Team',
    message: 'A new service request is available in your area. Please check your incoming job offers.',
    time: '10:30 AM',
    unread: true,
  },
  {
    id: '2',
    sender: 'Service Coordinator',
    message: 'Please remember to upload your work documentation after completing each job.',
    time: '9:15 AM',
    unread: true,
  },
  {
    id: '3',
    sender: 'Cougar Electric',
    message: 'Welcome to your technician workspace! Please keep your availability and working hours updated.',
    time: 'Yesterday',
    unread: false,
  },
];

export default function TechnicianMessages() {
  const [conversations, setConversations] =
    useState<Conversation[]>(sampleConversations);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const unreadCount = conversations.filter(
    conversation => conversation.unread
  ).length;

  const visibleConversations = unreadOnly
    ? conversations.filter(conversation => conversation.unread)
    : conversations;

  const selected = conversations.find(
    conversation => conversation.id === selectedId
  );

  // Opening a conversation marks it as read for this session.
  function openConversation(id: string) {
    setSelectedId(id);

    setConversations(previous =>
      previous.map(conversation =>
        conversation.id === id
          ? { ...conversation, unread: false }
          : conversation
      )
    );
  }

  return (
    <TechnicianScreen
      title="Messages"
      subtitle="Stay connected with your dispatch and service team."
    >
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>DEMO MESSAGES</Text>
        <Text style={styles.detail}>
          Sample conversations are shown until live messaging is connected.
        </Text>
      </View>

      {selected ? (
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedId(null)}
          >
            <Text style={styles.back}>‹ All conversations</Text>
          </Pressable>

          <Text style={styles.sender}>{selected.sender}</Text>
          <Text style={styles.detail}>{selected.time}</Text>

          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>
              {selected.message}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Conversations</Text>
            <Text style={styles.unreadCount}>
              {unreadCount} unread
            </Text>
          </View>

          <View style={styles.filters}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: !unreadOnly }}
              onPress={() => setUnreadOnly(false)}
              style={[
                styles.filter,
                !unreadOnly && styles.activeFilter,
              ]}
            >
              <Text style={[
                styles.filterText,
                !unreadOnly && styles.activeFilterText,
              ]}>
                All
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: unreadOnly }}
              onPress={() => setUnreadOnly(true)}
              style={[
                styles.filter,
                unreadOnly && styles.activeFilter,
              ]}
            >
              <Text style={[
                styles.filterText,
                unreadOnly && styles.activeFilterText,
              ]}>
                Unread
              </Text>
            </Pressable>
          </View>

          {visibleConversations.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.sender}>
                {unreadOnly ? "You're all caught up!" : 'No conversations'}
              </Text>
              <Text style={styles.detail}>
                {unreadOnly
                  ? 'There are no unread messages.'
                  : 'Your conversations will appear here.'}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {visibleConversations.map(conversation => (
                <Pressable
                  key={conversation.id}
                  accessibilityRole="button"
                  onPress={() => openConversation(conversation.id)}
                  style={({ pressed }) => [
                    styles.conversation,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {conversation.sender.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.conversationBody}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sender}>
                        {conversation.sender}
                      </Text>
                      {conversation.unread && (
                        <View
                          accessibilityLabel="Unread message"
                          style={styles.unreadDot}
                        />
                      )}
                    </View>

                    <Text
                      numberOfLines={2}
                      style={styles.detail}
                    >
                      {conversation.message}
                    </Text>

                    <Text style={styles.time}>
                      {conversation.time}
                    </Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </TechnicianScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#142139',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  noticeTitle: {
    color: '#65ABFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  unreadCount: {
    color: '#65ABFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filter: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeFilter: {
    backgroundColor: '#F5B900',
    borderColor: '#F5B900',
  },
  filterText: {
    color: '#94A2B8',
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#07101F',
  },
  list: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    borderBottomColor: '#293244',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#142139',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#65ABFF',
    fontSize: 20,
    fontWeight: '800',
  },
  conversationBody: {
    flex: 1,
    gap: 6,
  },
  sender: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  detail: {
    color: '#94A2B8',
    fontSize: 13,
    lineHeight: 20,
  },
  time: {
    color: '#74839B',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#65ABFF',
  },
  chevron: {
    color: '#94A2B8',
    fontSize: 26,
  },
  card: {
    backgroundColor: '#101827',
    borderColor: '#293244',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    gap: 14,
  },
  back: {
    color: '#F5B900',
    fontSize: 14,
    fontWeight: '700',
  },
  messageBubble: {
    backgroundColor: '#142139',
    borderRadius: 16,
    padding: 16,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 23,
  },
});