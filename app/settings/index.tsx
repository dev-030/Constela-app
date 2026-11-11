import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useThemeContext } from "@/providers/theme-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  User,
  Heart,
  CreditCard,
  Mail,
  Lock,
  Globe,
  UserX,
  Bell,
  History,
  LifeBuoy,
  CheckCircle2,
  Bug,
} from "lucide-react-native";
import { useMemo, useEffect } from "react";
import { useProfileStore } from "@/store/profileStore";
import {
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { useLogout, useDeleteAccountMutation } from "@/api/auth";
import { useTranslation } from "react-i18next";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { showAlert } from "@/components/ui/app-alert";

export default function SettingsIndexScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const logout = useLogout();
  const deleteAccount = useDeleteAccountMutation();
  useAndroidBack();

  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const secondary = useColor("secondary");
  const primary = useColor("primary");

  const { themePreference, setColorScheme, colorScheme } = useThemeContext();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const darkMode =
    themePreference === "dark" ||
    (themePreference === "system" && colorScheme === "dark");

  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const avatarSize = isCompact ? 88 : 116;
  const avatarBoxSize = isCompact ? 92 : 120;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingBottom: 16,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: text,
        },
        backBtn: {
          width: 40,
        },
        content: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: horizontalPadding,
          paddingTop: isCompact ? 14 : 24,
          paddingBottom: 40,
        },
        profileContainer: {
          flexDirection: "column",
          alignItems: "center",
          marginBottom: isCompact ? 20 : 32,
          marginTop: isCompact ? 8 : 16,
          gap: isCompact ? 8 : 12,
        },
        avatarContainer: {
          width: avatarBoxSize,
          height: avatarBoxSize,
          borderRadius: avatarBoxSize / 2,
          borderWidth: 2,
          borderColor: border,
          overflow: "hidden",
        },
        name: {
          fontSize: isCompact ? 20 : 24,
          fontWeight: "800",
          color: text,
          textAlign: "center",
          marginBottom: 2,
        },
        email: {
          fontSize: isCompact ? 13.5 : 15,
          color: muted,
          textAlign: "center",
        },
        section: {
          marginBottom: isCompact ? 18 : 28,
        },
        sectionTitle: {
          fontSize: isCompact ? 11 : 12,
          fontWeight: "700",
          color: muted,
          marginBottom: isCompact ? 6 : 8,
          marginLeft: 4,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
        sectionCard: {
          backgroundColor: cardColor,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
          overflow: "hidden",
        },
        itemRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: isCompact ? 12 : 16,
          paddingHorizontal: isCompact ? 13 : 16,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
        },
        itemIconBox: {
          width: isCompact ? 28 : 32,
          height: isCompact ? 28 : 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          marginRight: isCompact ? 10 : 12,
        },
        itemText: {
          fontSize: isCompact ? 14.5 : 16,
          fontWeight: "400",
          color: text,
        },
        logoutBtn: {
          marginTop: 16,
          borderRadius: 16,
        },
        deleteBtn: {
          marginTop: 12,
          borderRadius: 16,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#ef4444',
        },
        deleteBtnText: {
          color: '#ef4444',
        }
      }),
    [background, cardColor, text, muted, border, secondary, primary, colorScheme, isCompact, horizontalPadding, avatarBoxSize],
  );

  const renderItem = (title: string, icon: any, route: any, isLast = false) => (
    <Pressable style={[styles.itemRow, isLast && { borderBottomWidth: 0 }]} onPress={() => router.push(route)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.itemIconBox}>
          <Icon name={icon} size={isCompact ? 18 : 20} color={text} />
        </View>
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <Icon name={ChevronRight} size={isCompact ? 18 : 20} color={muted} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 110) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={profile?.photos?.find((p) => p.is_main)?.image || profile?.photos?.[0]?.image}
              size={avatarSize}
              style={{ borderRadius: avatarSize / 2 }}
              imageStyle={{ borderRadius: avatarSize / 2 }}
            />
          </View>
          <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Text style={styles.name}>{profile?.user?.first_name || profile?.username || '...'}</Text>
              {profile?.is_verified && <Icon name={CheckCircle2} size={18} color="#3B82F6" />}
            </View>
            <Text style={styles.email}>@{profile?.username || ''}</Text>
          </View>
        </View>

        {/* APPEARANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.sectionCard}>
            <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.itemIconBox}>
                  <Icon name={Moon} size={18} color={text} />
                </View>
                <Text style={styles.itemText}>{t('settings.dark_mode')}</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={(val) => setColorScheme(val ? "dark" : "light")}
                trackColor={{ false: muted + "55", true: primary }}
                thumbColor={Platform.OS === 'android' ? (darkMode ? "#ffffff" : "#f4f3f4") : undefined}
              />
            </View>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.profile'), User, "/profile")}
            {renderItem(t('settings.likes'), Heart, "/settings/likes")}
            {renderItem(t('settings.subscription'), CreditCard, "/settings/subscription")}
          </View>
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.change_password'), Lock, "/settings/password")}
            {renderItem(t('settings.change_language'), Globe, "/settings/language", true)}
          </View>
        </View>

        {/* PRIVACY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.blocked_users'), UserX, "/settings/blocked", true)}
          </View>
        </View>

        {/* NOTIFICATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.push_notification'), Bell, "/settings/notifications", true)}
          </View>
        </View>

        {/* SUBSCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.payments')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.payment_history'), History, "/settings/payment-history", true)}
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          <View style={styles.sectionCard}>
            {renderItem(t('settings.customer_support'), LifeBuoy, "/settings/support", true)}
          </View>
        </View>

        {/* DEBUG (developer only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <View style={styles.sectionCard}>
              {renderItem("RevenueCat Debug", Bug, "/settings/revenuecat-debug", true)}
            </View>
          </View>
        )}

        <Button
          variant="destructive"
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            i18n.changeLanguage('en');
            router.replace("/login");
          }}
        >
          {t('settings.logout')}
        </Button>

        <Button
          variant="outline"
          style={styles.deleteBtn}
          textStyle={styles.deleteBtnText}
          loading={deleteAccount.isPending}
          disabled={deleteAccount.isPending}
          onPress={() => {
            showAlert(
              "Delete Account",
              "Are you sure you want to delete your account? This action is permanent and will delete all your data.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteAccount.mutate(undefined, {
                      onSuccess: async () => {
                        await logout();
                        router.replace("/login");
                      }
                    });
                  }
                }
              ]
            );
          }}
        >
          Delete Account
        </Button>
      </ScrollView>
    </View>
  );
}
