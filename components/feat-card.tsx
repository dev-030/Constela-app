import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Clock,
  MessageCircle,
  User,
  PlayCircle,
  Search,
  MessageSquare,
  BookOpen,
  Users,
  Sliders,
  ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";

interface FeatureItem {
  icon: React.ComponentType<any>;
  text: string;
}

interface CardConfig {
  id: string;
  title: string;
  subtitle: string;
  badgeIonIcon: keyof typeof Ionicons.glyphMap;
  badgeColor: string;
  pillTextColorLight: string;
  pillTextColorDark: string;
  features: FeatureItem[];
  buttonText: string;
  path?: string;
}

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

function DashboardCard({ config }: { config: CardConfig }) {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { isCompact } = useResponsiveLayout();

  const titleColor = isDark ? "#F8FAFC" : "#0F172A";
  const subtitleColor = isDark ? "#94A3B8" : "#64748B";
  const pillTextColor = isDark ? config.pillTextColorDark : config.pillTextColorLight;
  const pillBg = isDark ? config.badgeColor + "22" : config.badgeColor + "14";
  const pillBorder = isDark ? config.badgeColor + "38" : config.badgeColor + "26";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
      onPress={() => config.path && router.push(config.path as any)}
    >
      {/* Background Watermark Icon */}
      <View style={styles.bgIconContainer} pointerEvents="none">
        <Ionicons
          name={config.badgeIonIcon}
          size={isCompact ? 100 : 140}
          color={config.badgeColor}
          style={{ opacity: isDark ? 0.04 : 0.05 }}
        />
      </View>

      <View style={[styles.contentContainer, isCompact && styles.contentContainerCompact]}>
        {/* Header */}
        <View style={[styles.header, isCompact && { gap: 10, marginBottom: 10 }]}>
          <View style={[styles.iconBadge, isCompact && styles.iconBadgeCompact, { backgroundColor: config.badgeColor }]}>
            <Ionicons name={config.badgeIonIcon} size={isCompact ? 20 : 24} color="#FFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.cardTitle, isCompact && styles.cardTitleCompact, { color: titleColor }]}>{config.title}</Text>
            <Text style={[styles.cardSubtitle, isCompact && styles.cardSubtitleCompact, { color: subtitleColor }]}>
              {config.subtitle}
            </Text>
          </View>
        </View>

        {/* Features / Tags with Harmonic Color Matching */}
        <View style={[styles.featuresList, isCompact && { gap: 5, marginBottom: 12 }]}>
          {config.features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                isCompact && styles.featureItemCompact,
                {
                  backgroundColor: pillBg,
                  borderColor: pillBorder,
                },
              ]}
            >
              <Icon name={feature.icon} size={isCompact ? 11 : 12} color={pillTextColor} />
              <Text style={[styles.featureText, isCompact && { fontSize: 11 }, { color: pillTextColor }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Solid Vibrant Action Button */}
        <View style={[styles.actionButton, isCompact && styles.actionButtonCompact, { backgroundColor: config.badgeColor }]}>
          <Text style={[styles.actionButtonText, isCompact && { fontSize: 13.5 }]}>{config.buttonText}</Text>
          <Icon name={ChevronRight} size={isCompact ? 15 : 17} color="#FFF" />
        </View>
      </View>
    </Pressable>
  );
}

export default function CardList() {
  const { t } = useTranslation();
  const primary = useColor("primary");
  const green = useColor("green") || "#10B981";
  const purple = useColor("purple") || "#8B5CF6";

  const cardsData: CardConfig[] = [
    {
      id: "meet",
      title: t('dashboard.meet_title'),
      subtitle: t('dashboard.meet_subtitle'),
      badgeIonIcon: "heart",
      badgeColor: primary,
      pillTextColorLight: "#9D174D",
      pillTextColorDark: "#FDA4AF",
      buttonText: t('dashboard.meet_btn'),
      features: [
        { icon: User, text: t('dashboard.meet_f1') },
        { icon: Sliders, text: t('dashboard.meet_f2') },
        { icon: Clock, text: t('dashboard.meet_f3') },
      ],
      path: "/matches",
    },
    {
      id: "friends",
      title: t('dashboard.friends_title'),
      subtitle: t('dashboard.friends_subtitle'),
      badgeIonIcon: "people",
      badgeColor: green,
      pillTextColorLight: "#065F46",
      pillTextColorDark: "#6EE7B7",
      buttonText: t('dashboard.friends_btn'),
      features: [
        { icon: Search, text: t('dashboard.friends_f1') },
        { icon: PlayCircle, text: t('dashboard.friends_f2') },
        { icon: MessageCircle, text: t('dashboard.friends_f3') },
      ],
      path: "/friends",
    },
    {
      id: "community",
      title: t('dashboard.community_title'),
      subtitle: t('dashboard.community_subtitle'),
      badgeIonIcon: "planet",
      badgeColor: purple,
      pillTextColorLight: "#5B21B6",
      pillTextColorDark: "#C4B5FD",
      buttonText: t('dashboard.community_btn'),
      features: [
        { icon: MessageSquare, text: t('dashboard.community_f1') },
        { icon: BookOpen, text: t('dashboard.community_f2') },
        { icon: Users, text: t('dashboard.community_f3') },
      ],
      path: "/community",
    },
  ];

  return (
    <View style={styles.listContainer}>
      {cardsData.map((card) => (
        <DashboardCard key={card.id} config={card} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: 16,
  },
  cardContainer: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  bgIconContainer: {
    position: "absolute",
    right: -16,
    bottom: -16,
    zIndex: 0,
    transform: [{ rotate: "-15deg" }],
  },
  contentContainer: {
    padding: 20,
    zIndex: 1,
  },
  contentContainerCompact: {
    padding: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  iconBadgeCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardTitleCompact: {
    fontSize: 17,
  },
  cardSubtitle: {
    fontSize: 13.5,
    fontWeight: "400",
    lineHeight: 18,
  },
  cardSubtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  featuresList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  featureItemCompact: {
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: "stretch",
  },
  actionButtonCompact: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
