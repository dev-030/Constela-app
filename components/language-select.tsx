import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View, type ViewStyle } from "react-native";
import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useColor } from "@/hooks/useColor";
import { LANGUAGES } from "@/constants/languages";

interface LanguageSelectProps {
  value: string[];
  onChange: (languages: string[]) => void;
  /** Red border + message under the field. */
  error?: string;
  style?: ViewStyle;
}

/**
 * Multi-select of world languages: a field showing the chosen languages as
 * removable chips, and a searchable bottom sheet with the global list.
 * Values are the canonical English names from constants/languages, which is
 * what profiles store and the matching filter compares against.
 */
export function LanguageSelect({ value, onChange, error, style }: LanguageSelectProps) {
  const { t } = useTranslation();
  const border = useColor("border");
  const card = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const danger = useColor("red");

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Keep any older free-text entries (from the previous text field) selectable too.
  const options = useMemo(() => {
    const extra = value.filter((v) => !LANGUAGES.includes(v));
    return [...extra, ...LANGUAGES];
  }, [value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((l) => l.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const toggle = (lang: string) => {
    onChange(value.includes(lang) ? value.filter((v) => v !== lang) : [...value, lang]);
  };

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <View style={style}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{
          borderWidth: 1,
          borderColor: error ? danger : border,
          backgroundColor: card,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: value.length ? 10 : 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {value.length === 0 ? (
            <Text style={{ color: muted, fontSize: 15 }}>
              {t("onboarding.select_languages", "Select languages")}
            </Text>
          ) : (
            value.map((lang) => (
              <View
                key={lang}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: primary + "18",
                  borderRadius: 14,
                  paddingLeft: 10,
                  paddingRight: 6,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: primary, fontSize: 13, fontWeight: "600" }}>{lang}</Text>
                <Pressable onPress={() => toggle(lang)} hitSlop={8} accessibilityLabel={`Remove ${lang}`}>
                  <X size={14} color={primary} strokeWidth={2.5} />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <ChevronDown size={20} color={muted} />
      </Pressable>
      {error ? <Text style={{ color: danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      <BottomSheet
        isVisible={open}
        onClose={close}
        title={t("onboarding.select_languages", "Select languages")}
        snapPoints={[0.7]}
        headerComponent={
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View
              style={{
                marginBottom: 12,
                backgroundColor: card,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Search size={20} color={muted} style={{ marginRight: 8 }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("onboarding.search_languages", "Search languages...")}
                placeholderTextColor={muted}
                autoCorrect={false}
                style={{ color: text, fontSize: 16, flex: 1, padding: 0 }}
              />
            </View>
          </View>
        }
      >
        <View style={{ paddingBottom: 24, paddingHorizontal: 16 }}>
          {filtered.map((lang, i) => {
            const selected = value.includes(lang);
            return (
              <Pressable
                key={lang}
                onPress={() => toggle(lang)}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: i === filtered.length - 1 ? 0 : 1,
                  borderBottomColor: border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: text, fontSize: 16, fontWeight: selected ? "600" : "400" }}>{lang}</Text>
                {selected && <Check size={20} color={primary} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
