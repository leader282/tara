import { InlineMessage } from "@/components/ui";

type InviteErrorMessageProps = {
  message?: string | null;
};

export function InviteErrorMessage({ message }: InviteErrorMessageProps) {
  if (!message) {
    return null;
  }

  return <InlineMessage message={message} tone="danger" />;
}
