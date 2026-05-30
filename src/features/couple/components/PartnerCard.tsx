import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import type { PartnerProfileSummary } from "@/features/couple/types";
import { spacing } from "@/theme/tokens";

type PartnerCardProps = {
  partnerProfile: PartnerProfileSummary;
};

function getLocationLabel(partnerProfile: PartnerProfileSummary): string {
  const city = partnerProfile.city?.trim();
  const country = partnerProfile.country?.trim();

  if (city && country) {
    return `${city}, ${country}`;
  }

  if (city) {
    return city;
  }

  if (country) {
    return country;
  }

  return "Location kept private";
}

export function PartnerCard({ partnerProfile }: PartnerCardProps) {
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="subtitle">Your partner</AppText>
        <AppText accessibilityLabel="Partner name" variant="body">
          {partnerProfile.display_name}
        </AppText>
        <AppText accessibilityLabel="Partner location" color="textSecondary" variant="bodyMuted">
          {getLocationLabel(partnerProfile)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
