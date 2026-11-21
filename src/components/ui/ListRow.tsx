import { Children, Fragment, isValidElement, type PropsWithChildren, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, shadows, spacing, type ColorName } from "@/theme/tokens";

export type ListIconTone = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

const iconToneStyles: Record<ListIconTone, { background: string; color: ColorName }> = {
  primary: { background: colors.primarySoft, color: "primaryStrong" },
  info: { background: colors.infoSoft, color: "info" },
  success: { background: colors.successSoft, color: "success" },
  warning: { background: colors.warningSoft, color: "warning" },
  danger: { background: colors.dangerSoft, color: "danger" },
  neutral: { background: colors.surfaceMuted, color: "textSecondary" },
};

type ListGroupProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  inset?: number;
}>;

export function ListGroup({ children, style, inset = 64 }: ListGroupProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[styles.group, style]}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <View style={[styles.divider, { marginLeft: inset }]} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

function RowIcon({ icon, tone }: { icon: IconName; tone: ListIconTone }) {
  const toneStyle = iconToneStyles[tone];

  return (
    <View style={[styles.iconWell, { backgroundColor: toneStyle.background }]}>
      <Icon color={toneStyle.color} name={icon} size={19} />
    </View>
  );
}

type ListRowProps = {
  title: string;
  description?: string;
  value?: string;
  icon?: IconName;
  iconTone?: ListIconTone;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  trailing?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function ListRow({
  title,
  description,
  value,
  icon,
  iconTone = "primary",
  onPress,
  disabled = false,
  destructive = false,
  trailing,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const isInteractive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={isInteractive ? "button" : undefined}
      accessibilityState={{ disabled }}
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && isInteractive ? styles.rowPressed : null,
        disabled ? styles.rowDisabled : null,
      ]}
    >
      {icon ? <RowIcon icon={icon} tone={destructive ? "danger" : iconTone} /> : null}
      <View style={styles.copy}>
        <AppText color={destructive ? "danger" : "textPrimary"} style={styles.title} variant="label">
          {title}
        </AppText>
        {description ? (
          <AppText color="textSecondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText color="textSecondary" numberOfLines={1} style={styles.value} variant="caption">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {isInteractive && !trailing ? (
        <Icon color="textTertiary" name="chevron-forward" size={18} />
      ) : null}
    </Pressable>
  );
}

type SwitchRowProps = {
  title: string;
  description?: string;
  icon?: IconName;
  iconTone?: ListIconTone;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function SwitchRow({
  title,
  description,
  icon,
  iconTone = "primary",
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: SwitchRowProps) {
  return (
    <View style={[styles.row, disabled ? styles.rowDisabled : null]}>
      {icon ? <RowIcon icon={icon} tone={iconTone} /> : null}
      <View style={styles.copy}>
        <AppText style={styles.title} variant="label">
          {title}
        </AppText>
        {description ? (
          <AppText color="textSecondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        ios_backgroundColor={colors.borderStrong}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...shadows.card,
  },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconWell: {
    alignItems: "center",
    borderRadius: radii.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  value: {
    maxWidth: 140,
  },
});
