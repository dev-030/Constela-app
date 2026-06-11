import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  Heart,
  RotateCcw,
  Sliders,
  Star,
  User,
  X,
} from "lucide-react-native";
import Swipe from "@/components/swipe";
import { Button } from "@/components/ui/button";

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
   const primary = useColor("primary");
  const secondary = useColor("secondary");
  const muted = useColor("textMuted");
  const text = useColor("text");

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* Custom Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: useColor("border"),
        }}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 60, height: 40 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Icon name={Bell} size={24} />
          <Pressable onPress={() => router.push("/drawer")}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: muted,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=68" }}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#34C759",
                borderWidth: 2,
                borderColor: background,
              }}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Filters Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            Find Your Perfect Match by Filters
          </Text>
          <Icon name={Sliders} size={20} />
        </View>

        {/* Card Stack Area */}
        <View
          style={{
            backgroundColor: "#F9ECEE",
            borderRadius: 32,
            padding: 16,
            paddingTop: 32,
            alignItems: "center",
            // height: 480,
          }}
        >

          {/* Cards container to simulate stack */}
          <View
            style={{
              width: "100%",
              height: 460,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Swipe />
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              marginTop: 40,
              zIndex: 10,
            }}
          >
            {/* Reject */}
            <Pressable
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#004D40",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              <Icon name={X} size={32} color="#FFF" />
            </Pressable>

            {/* Super Like */}
            <Pressable
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#FFF",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <Icon name={Star} size={24} color="#E65100" />
            </Pressable>

            {/* Like */}
            <Pressable
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: primary,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              <Icon name={Heart} size={32} color="#FFF" />
            </Pressable>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}
