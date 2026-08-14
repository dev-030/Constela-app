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
  CheckCircle2
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
import { useLogout } from "@/api/auth";
import { useTranslation } from "react-i18next";
import { useAndroidBack } from "@/hooks/useAndroidBack";

export default function SettingsIndexScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const logout = useLogout();
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
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        },
        profileContainer: {
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 32,
          marginTop: 16,
          gap: 12,
        },
        avatarContainer: {
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: border,
          overflow: "hidden",
        },
        name: {
          fontSize: 24,
          fontWeight: "800",
          color: text,
          textAlign: "center",
          marginBottom: 2,
        },
        email: {
          fontSize: 15,
          color: muted,
          textAlign: "center",
        },
        section: {
          marginBottom: 28,
        },
        sectionTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: muted,
          marginBottom: 8,
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
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
        },
        itemIconBox: {
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        },
        itemText: {
          fontSize: 16,
          fontWeight: "400",
          color: text,
        },
        logoutBtn: {
          marginTop: 16,
          borderRadius: 16,
        }
      }),
    [background, cardColor, text, muted, border, secondary, primary, colorScheme],
  );

  const renderItem = (title: string, icon: any, route: any, isLast = false) => (
    <Pressable style={[styles.itemRow, isLast && { borderBottomWidth: 0 }]} onPress={() => router.push(route)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.itemIconBox}>
          <Icon name={icon} size={20} color={text} />
        </View>
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <Icon name={ChevronRight} size={20} color={muted} />
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Avatar 
              uri={profile?.photos?.[0]?.image} 
              size={116} 
              style={{ borderRadius: 58 }}
              imageStyle={{ borderRadius: 58 }}
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
            {renderItem(t('settings.change_email'), Mail, "/settings/email", true)}
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
      </ScrollView>
    </View>
  );
}
