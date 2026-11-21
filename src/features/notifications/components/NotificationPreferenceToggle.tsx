import { SwitchRow, type IconName, type ListIconTone } from "@/components/ui";

type NotificationPreferenceToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  icon?: IconName;
  iconTone?: ListIconTone;
};

export function NotificationPreferenceToggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  icon,
  iconTone,
}: NotificationPreferenceToggleProps) {
  return (
    <SwitchRow
      accessibilityLabel={accessibilityLabel ?? label}
      description={description}
      disabled={disabled}
      icon={icon}
      iconTone={iconTone}
      onValueChange={onValueChange}
      title={label}
      value={value}
    />
  );
}
