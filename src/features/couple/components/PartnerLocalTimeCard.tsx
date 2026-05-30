import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import type { PartnerProfileSummary } from "@/features/couple/types";
import { formatTimeInTimeZone, isValidTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

type PartnerLocalTimeCardProps = {
  partnerProfile: PartnerProfileSummary;
};

const REFRESH_INTERVAL_MS = 30_000;

export function PartnerLocalTimeCard({ partnerProfile }: PartnerLocalTimeCardProps) {
  const [now, setNow] = useState(() => new Date());
  const partnerTimeZone = partnerProfile.timezone?.trim() ?? "";
  const hasValidTimeZone = partnerTimeZone.length > 0 && isValidTimeZone(partnerTimeZone);

  useEffect(() => {
    if (!hasValidTimeZone) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(new Date());
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [hasValidTimeZone]);

  const localTime = useMemo(() => {
    if (!hasValidTimeZone) {
      return null;
    }

    return formatTimeInTimeZone(now, partnerTimeZone);
  }, [hasValidTimeZone, now, partnerTimeZone]);

  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="subtitle">Partner local time</AppText>
        {localTime ? (
          <>
            <AppText accessibilityLabel="Partner local time" variant="title">
              {localTime}
            </AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              {partnerProfile.display_name}&apos;s timezone: {partnerTimeZone}
            </AppText>
          </>
        ) : (
          <AppText color="textSecondary" variant="bodyMuted">
            Add a timezone during profile updates later.
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
