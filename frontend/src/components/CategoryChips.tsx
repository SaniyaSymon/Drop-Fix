import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View
} from "react-native";

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  testIDPrefix?: string;
}

/**
 * P0 ZERO TOLERANCE Filter Chip Row:
 * - Single horizontal scroller (ScrollView horizontal=true, showsHorizontalScrollIndicator=false)
 * - Chips NEVER wrap to second line
 * - Each chip has flexShrink: 0
 * - Fixed sizes: chip height 36pt, row height 56pt
 * - Selected chip changes color/border only, NEVER size, padding or font-weight
 */
export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  testIDPrefix = "filter-chip"
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              testID={`${testIDPrefix}-${cat.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
              style={[
                styles.chip,
                isSelected && styles.chipActive
              ]}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive
                ]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    justifyContent: "center",
    backgroundColor: "transparent"
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0
  },
  chipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7"
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569"
  },
  chipTextActive: {
    color: "#FFFFFF"
  }
});
