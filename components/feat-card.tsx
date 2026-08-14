import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Heart,
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
import { BORDER_RADIUS } from "@/theme/globals";

interface FeatureItem {
  icon: React.ComponentType<any>;
  text: string;
}

interface CardConfig {
  id: string;
  title: string;
  subtitle: string;
  badgeIcon: React.ComponentType<any>;
  badgeColor: string;
  features: FeatureItem[];
  buttonText: string;
  path?: string;
}

function DashboardCard({ config }: { config: CardConfig }) {
  const router = useRouter();
  const cardBg = useColor("card");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const border = useColor("border");

  return (
    <Pressable
      style={[
        styles.cardContainer,
        { backgroundColor: cardBg, borderColor: border, borderWidth: 1 },
      ]}
      onPress={() => config.path && router.push(config.path as any)}
    >
      {/* Large faint background icon */}
      <View style={styles.bgIconContainer} pointerEvents="none">
        <Icon
          name={config.badgeIcon}
          size={160}
          color={config.badgeColor}
          style={{ opacity: 0.05 }}
        />
      </View>

      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: config.badgeColor }]}>
            <Icon name={config.badgeIcon} size={24} color="#FFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.cardTitle, { color: text }]}>{config.title}</Text>
            <Text style={[styles.cardSubtitle, { color: textMuted }]}>
              {config.subtitle}
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {config.features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: config.badgeColor + "15", borderColor: config.badgeColor + "30" }]}>
              <Icon name={feature.icon} size={14} color={config.badgeColor} />
              <Text style={[styles.featureText, { color: text }]}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <View style={[styles.actionButton, { backgroundColor: config.badgeColor }]}>
          <Text style={styles.actionButtonText}>{config.buttonText}</Text>
          <Icon name={ChevronRight} size={18} color="#FFF" />
        </View>
      </View>
    </Pressable>
  );
}

export default function CardList() {
  const { t } = useTranslation();
  const primary = useColor("primary");
  const green = useColor("green") || "#30D158";
  const purple = useColor("purple") || "#BF5AF2";

  const cardsData: CardConfig[] = [
    {
      id: "meet",
      title: t('dashboard.meet_title'),
      subtitle: t('dashboard.meet_subtitle'),
      badgeIcon: Heart,
      badgeColor: primary,
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
      badgeIcon: Users,
      badgeColor: green,
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
      badgeIcon: MessageSquare,
      badgeColor: purple,
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
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  bgIconContainer: {
    position: "absolute",
    right: -20,
    bottom: -20,
    zIndex: 0,
    transform: [{ rotate: "-15deg" }],
  },
  contentContainer: {
    padding: 24,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignSelf: "stretch",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
