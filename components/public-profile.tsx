import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Check, Heart, MoreHorizontal, Star, X } from "lucide-react-native";
import { Image, ScrollView, StyleSheet, View, Pressable } from "react-native";

const PRIMARY = "#DE4177";

export default function ProfileSheet() {
  const background = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={[styles.name, { color: text }]}>Sam, 28</Text>
        <Pressable hitSlop={12}>
          <Icon name={MoreHorizontal} size={24} color={text} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <Image
          source={require("@/assets/profiles/liam.png")} // using one of the generated images
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Neurotype */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: muted }]}>NEUROTYPE</Text>
          <View style={styles.pillContainer}>
            <View style={[styles.pill, { backgroundColor: "#A7F3D0" }]}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#065F46" }}
              >
                Autistic
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: "#A7F3D0" }]}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#065F46" }}
              >
                i'm neurodivergent
              </Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: muted }]}>BIO</Text>
          <Text style={[styles.bioText, { color: text }]}>
            "I value parallel play and deep conversations. Introvert, coffee
            lover, and space enthusiast."
          </Text>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: muted }]}>INTERESTS</Text>
          <View style={styles.pillContainer}>
            {["🎮 Gaming", "🎨 Art", "🚀 Space", "☕ Coffee"].map(
              (interest) => (
                <View
                  key={interest}
                  style={[styles.pillOutline, { borderColor: border }]}
                >
                  <Text style={{ fontSize: 13, color: text }}>{interest}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* Sensory Profile */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <Text style={[styles.sectionTitle, { color: muted }]}>
            SENSORY PROFILE
          </Text>
          <View style={styles.sensoryContainer}>
            <View style={[styles.sensoryItem, { borderColor: border }]}>
              <Text style={{ fontSize: 14, color: text }}>
                💡 Soft Lighting Only
              </Text>
              <Icon name={Check} size={20} color="#059669" />
            </View>
            <View style={[styles.sensoryItem, { borderColor: border }]}>
              <Text style={{ fontSize: 14, color: text }}>
                🔇 Quiet Spaces Preferred
              </Text>
              <Icon name={Check} size={20} color="#059669" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <Pressable style={styles.rejectButton}>
          <Icon name={X} size={32} color="#FFF" />
        </Pressable>

        <Pressable style={styles.superLikeButton}>
          <Icon name={Star} size={24} color="#E65100" />
        </Pressable>

        <Pressable style={[styles.likeButton, { backgroundColor: PRIMARY }]}>
          <Icon name={Heart} size={32} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photo: {
    width: 380,
    height: 380,
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bioText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
  },
  pillOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sensoryContainer: {
    gap: 12,
  },
  sensoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonsRow: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 10,
  },
  rejectButton: {
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
    elevation: 4,
  },
  superLikeButton: {
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
    elevation: 2,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
