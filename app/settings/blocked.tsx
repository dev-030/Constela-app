import React from "react";
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, UserX } from "lucide-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { useColor } from "@/hooks/useColor";
import { useBlockedUsersQuery, useUnblockUserMutation, BlockedUserEntry } from "@/api/matching";
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from "react-i18next";
import { showAlert } from "@/components/ui/app-alert";

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { data: blockedUsers, isLoading, isError, refetch } = useBlockedUsersQuery();
  const unblockMutation = useUnblockUserMutation();

  const handleUnblock = (user: BlockedUserEntry) => {
    showAlert(
      t('settings_pages.unblock_user'),
      t('settings_pages.unblock_confirm', { username: user.username }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('settings_pages.unblock'),
          style: "destructive",
          onPress: () => {
            unblockMutation.mutate(user.profile_id, {
              onSuccess: () => {
                // query invalidation is handled in the mutation
              },
              onError: () => {
                showAlert(t('edit_profile.error'), "Could not unblock the user. Please try again.");
              }
            });
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUserEntry }) => (
    <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
      <View style={styles.cardInfo}>
        <View style={styles.avatarPlaceholder}>
          <Icon name={UserX} size={20} color={muted} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.username, { color: text }]}>@{item.username}</Text>
          <Text style={[styles.date, { color: muted }]}>
            {t('settings_pages.blocked_on', { date: new Date(item.blocked_at).toLocaleDateString() })}
          </Text>
        </View>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.unblockBtn, 
          { borderColor: border },
          pressed && { opacity: 0.7 }
        ]}
        onPress={() => handleUnblock(item)}
        disabled={unblockMutation.isPending}
      >
        <Text style={[styles.unblockBtnText, { color: text }]}>{t('settings_pages.unblock')}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>{t('settings_pages.blocked_users')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={{ color: muted, marginBottom: 12 }}>{t('settings_pages.failed_load_blocked')}</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={{ color: primary, fontWeight: "600" }}>{t('connections.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.block_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: card, borderColor: border }]}>
                <Icon name={UserX} size={32} color={muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: text }]}>{t('settings_pages.no_blocked_users')}</Text>
              <Text style={[styles.emptyText, { color: muted }]}>
                When you block someone, they will appear here. You can unblock them at any time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  unblockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unblockBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
