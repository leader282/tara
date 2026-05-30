import { AppText } from "@/components/ui";

type InviteErrorMessageProps = {
  message?: string | null;
};

export function InviteErrorMessage({ message }: InviteErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <AppText color="danger" variant="caption">
      {message}
    </AppText>
  );
}
