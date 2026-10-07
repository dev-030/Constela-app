import { useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useSubmitSupportTicketMutation, useMySupportTicketsQuery } from "@/api/settings";
import { formatDistanceToNow } from "date-fns";
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from "react-i18next";

export default function SupportScreen() {
  const { t } = useTranslation();
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const cardColor = useColor("card");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: submitTicket, isPending } = useSubmitSupportTicketMutation();
  const { data: tickets, refetch } = useMySupportTicketsQuery();

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert(t('edit_profile.error'), "Please provide a subject and a description.");
      return;
    }

    submitTicket(
      { subject, description },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          refetch();
          Alert.alert(t('settings_pages.ticket_submitted'), t('settings_pages.ticket_submitted_desc'));
        },
        onError: () => {
          Alert.alert(t('edit_profile.error'), "Could not submit your ticket. Please try again.");
        }
      }
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>{t('settings_pages.customer_support')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: muted }]}>
          {t('settings_pages.need_help')}
        </Text>

        <Text style={[styles.label, { color: text }]}>{t('settings_pages.subject')}</Text>
        <TextInput
          style={[styles.input, { color: text, borderColor: border, backgroundColor: cardColor }]}
          placeholder="e.g., Billing Issue, Bug Report"
          placeholderTextColor={muted}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={[styles.label, { color: text }]}>{t('settings_pages.description')}</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { color: text, borderColor: border, backgroundColor: cardColor }
          ]}
          placeholder="Please describe your problem in detail..."
          placeholderTextColor={muted}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {tickets && tickets.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: text }]}>Previous Tickets</Text>
            {tickets.map((tItem) => (
              <View key={tItem.id} style={[styles.ticketCard, { backgroundColor: cardColor, borderColor: border }]}>
                <View style={styles.ticketHeader}>
                  <Text style={[styles.ticketSubject, { color: text }]} numberOfLines={1}>{tItem.subject}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: tItem.status === 'resolved' ? '#10b981' : tItem.status === 'in_progress' ? '#f59e0b' : '#3b82f6' }]}>
                    <Text style={styles.statusText}>{tItem.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.ticketDesc, { color: muted }]} numberOfLines={2}>{tItem.description}</Text>
                <Text style={[styles.ticketDate, { color: muted }]}>
                  {formatDistanceToNow(new Date(tItem.created_at), { addSuffix: true })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button 
          onPress={handleSubmit} 
          disabled={isPending}
          style={styles.submitBtn}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : t('settings_pages.submit_ticket')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 24,
  },
  textArea: {
    height: 160,
    paddingTop: 16,
  },
  footer: {
    padding: 24,
  },
  submitBtn: {
    height: 56,
    borderRadius: 24,
  },
  historySection: {
    marginTop: 40,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  ticketDesc: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketDate: {
    fontSize: 12,
  }
});
