import React from "react";
import { View, Image, StyleSheet, Pressable } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  Clock,
  Heart,
  MessageCircle,
  User,
  PlayCircle,
  Search,
  Coffee,
  Users,
  MessageSquare,
  BookOpen,
  Sliders,
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
  badgeIcon: React.ComponentType<any>;
  themeColors: {
    cardBg: string;
    badgeBg: string;
    accentText: string;
  };
  features: FeatureItem[];
  buttonText: string;
  rightElement: "preview" | "illustration";
  illustrationText?: string;
  path?: string;
}

interface DashboardCardProps {
  config: CardConfig;
  primaryColor: string;
  mutedColor: string;
}

function DashboardCard({
  config,
  primaryColor,
  mutedColor,
}: DashboardCardProps) {
  const { themeColors, rightElement } = config;
  const router = useRouter();
  const text = useColor("text")

  return (
    <View
      style={[styles.cardContainer, { backgroundColor: themeColors.cardBg }]}
    >
      {/* Left Content Column */}
      <View style={styles.cardLeftColumn}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColors.badgeBg }]}
          >
            <Icon
              name={config.badgeIcon}
              size={config.id === "meet" ? 20 : 24}
              color="#FFF"
            />
          </View>
          {config.id === "meet" && (
            <Text style={styles.cardTitle}>{config.title}</Text>
          )}
        </View>

        {config.id !== "meet" && (
          <Text style={styles.cardTitle}>{config.title}</Text>
        )}

        <Text style={[styles.cardSubtitle, { color: mutedColor }]}>
          {config.subtitle}
        </Text>

        <View style={styles.featuresList}>
          {config.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon
                name={feature.icon}
                size={16}
                color={themeColors.accentText}
              />
              <Text
                style={[styles.featureText, { color: themeColors.accentText }]}
              >
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => config.path && router.push(config.path)}>
          <Text style={{
            color: text,
            backgroundColor: primaryColor,
            padding: 12,
            borderRadius: 20,
            textAlign: "center"
          }}>{config.buttonText}</Text>
        </Pressable>
      </View>

      {/* Right Visual Element */}
      <View style={styles.mockIllustrationCard}>
          <View
            style={[
              styles.illustrationContent,
              {
                backgroundColor:
                  themeColors.cardBg === "#E8F5E9" ? "#E0F2F1" : "#E8EAF6",
              },
            ]}
          >
            <Text
              style={[
                styles.illustrationText,
                { color: themeColors.accentText },
              ]}
            >
              {config.illustrationText}
            </Text>
            <Icon
              name={config.badgeIcon}
              size={40}
              color={themeColors.accentText}
              style={styles.illustrationIcon}
            />
          </View>
        </View>
    </View>
  );
}

export default function CardList() {
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  const cardsData: CardConfig[] = [
    {
      id: "meet",
      title: "Meet",
      subtitle: "Find a connection that fits you.",
      badgeIcon: Heart,
      themeColors: {
        cardBg: "#facad4" + 30,
        badgeBg: primary,
        accentText: "#004D40",
      },
      buttonText: "Matches Now",
      rightElement: "illustration",
      illustrationText: "Meet",
      features: [
        { icon: User, text: "Compatible profiles" },
        { icon: Sliders, text: "Sensory filters" },
        { icon: Clock, text: "Respect your pace" },
      ],
      path: "/matches",
    },
    {
      id: "friends",
      title: "Friends",
      subtitle: "Build genuine friendships and feel welcome.",
      badgeIcon: User,
      themeColors: {
        cardBg: "#E8F5E9" + 30,
        badgeBg: "#059669",
        accentText: "#004D40",
      },
      buttonText: "Explore",
      rightElement: "illustration",
      illustrationText: "Friends",
      features: [
        { icon: Search, text: "Find friends" },
        { icon: PlayCircle, text: "Shared activities" },
        { icon: MessageCircle, text: "Safe conversations" },
      ],
      path: "/friends",
    },
    {
      id: "community",
      title: "Community",
      subtitle: "Build genuine friendships and feel welcome.",
      badgeIcon: Users,
      themeColors: {
        cardBg: "#F3E5F5" + 30,
        badgeBg: "#1A237E",
        accentText: "#1A237E",
      },
      buttonText: "Explore",
      rightElement: "illustration",
      illustrationText: "Community",
      features: [
        { icon: MessageSquare, text: "Forums & discussions" },
        { icon: BookOpen, text: "Resources & advice" },
        { icon: Users, text: "Events & groups" },
      ],
      path: "/community",
    },
  ];

  return (
    <View style={styles.listContainer}>
      {cardsData.map((card) => (
        <DashboardCard
          key={card.id}
          config={card}
          primaryColor={primary}
          mutedColor={muted}
        />
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
    padding: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardLeftColumn: {
    flex: 1,
    paddingRight: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconBadge: {
    borderRadius: 24,
    padding: 12,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardSubtitle: {
    marginBottom: 16,
    fontSize: 14,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    //  height: 40,
    //  paddingHorizontal: 24,
    alignSelf: "flex-start",
    borderRadius: 20,
    marginTop: 16,
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  /* Right Side elements */
  previewCard: {
    width: 140,
    height: 200,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewHeartBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFF",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewNameText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#FFD60A",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  mockIllustrationCard: {
    width: 140,
    height: 140,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "flex-end",
  },
  illustrationContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  illustrationIcon: {
    marginTop: 16,
  },
});
