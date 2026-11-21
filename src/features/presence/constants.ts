export const PRESENCE_PULSE_TYPES = [
  "thinking_of_you",
  "miss_you",
  "hug",
  "good_morning",
  "good_night",
  "safe_arrived",
  "proud_of_you",
] as const;

export type PresencePulseTypeValue = (typeof PRESENCE_PULSE_TYPES)[number];

type PresencePulseDetails = {
  label: string;
  shortLabel: string;
  description: string;
  accessibilityLabel: string;
  emoji: string;
  tint: string;
  accent: string;
  sentTitle: (partnerName: string) => string;
  sentMessage: string;
  receivedTitle: (partnerName: string) => string;
  receivedMessage: string;
};

export const PRESENCE_PULSE_OPTIONS = {
  thinking_of_you: {
    label: "Thinking of you",
    shortLabel: "Thinking",
    description: "A gentle reminder that your partner is on your mind.",
    accessibilityLabel: "Send a thinking of you pulse",
    emoji: "💭",
    tint: "#EFEAFB",
    accent: "#6B55C7",
    sentTitle: (partnerName) => `Thinking of you, sent to ${partnerName}`,
    sentMessage: "They'll know they're on your mind.",
    receivedTitle: (partnerName) => `${partnerName} is thinking of you`,
    receivedMessage: "A little reminder that you're on their mind.",
  },
  miss_you: {
    label: "Miss you",
    shortLabel: "Miss you",
    description: "A soft way to say the distance feels a little bigger today.",
    accessibilityLabel: "Send a miss you pulse",
    emoji: "🥺",
    tint: "#E6EFFA",
    accent: "#3F6FB0",
    sentTitle: (partnerName) => `"Miss you" sent to ${partnerName}`,
    sentMessage: "A little closeness, on its way.",
    receivedTitle: (partnerName) => `${partnerName} misses you`,
    receivedMessage: "The distance feels a little bigger today.",
  },
  hug: {
    label: "Hug",
    shortLabel: "Hug",
    description: "A warm squeeze sent across the distance.",
    accessibilityLabel: "Send a hug pulse",
    emoji: "🤗",
    tint: "#FCEBDD",
    accent: "#B8692A",
    sentTitle: (partnerName) => `Hug sent to ${partnerName}`,
    sentMessage: "Wrapped up warm and on its way.",
    receivedTitle: (partnerName) => `${partnerName} sent you a hug`,
    receivedMessage: "Wrapped up warm and sent across the miles.",
  },
  good_morning: {
    label: "Good morning",
    shortLabel: "Morning",
    description: "A calm start to your partner's day.",
    accessibilityLabel: "Send a good morning pulse",
    emoji: "☀️",
    tint: "#FDF3D5",
    accent: "#A57A0B",
    sentTitle: (partnerName) => `Good morning sent to ${partnerName}`,
    sentMessage: "A bright start to their day.",
    receivedTitle: (partnerName) => `Good morning from ${partnerName}`,
    receivedMessage: "They're starting the day thinking of you.",
  },
  good_night: {
    label: "Good night",
    shortLabel: "Night",
    description: "A gentle close to the day before sleep.",
    accessibilityLabel: "Send a good night pulse",
    emoji: "🌙",
    tint: "#E8E7F6",
    accent: "#4B4A9A",
    sentTitle: (partnerName) => `Good night sent to ${partnerName}`,
    sentMessage: "Sweet dreams are on their way.",
    receivedTitle: (partnerName) => `Good night from ${partnerName}`,
    receivedMessage: "Sweet dreams are on their way to you.",
  },
  safe_arrived: {
    label: "Arrived safely",
    shortLabel: "Safe",
    description: "A reassuring check-in that you made it safely.",
    accessibilityLabel: "Send an arrived safely pulse",
    emoji: "🏡",
    tint: "#E3F2EA",
    accent: "#2E7D57",
    sentTitle: (partnerName) => `${partnerName} knows you arrived safely`,
    sentMessage: "One less thing for them to worry about.",
    receivedTitle: (partnerName) => `${partnerName} arrived safely`,
    receivedMessage: "Just letting you know they made it.",
  },
  proud_of_you: {
    label: "Proud of you",
    shortLabel: "Proud",
    description: "A small note of support and encouragement.",
    accessibilityLabel: "Send a proud of you pulse",
    emoji: "🌟",
    tint: "#FCE6EC",
    accent: "#B83E66",
    sentTitle: (partnerName) => `"Proud of you" sent to ${partnerName}`,
    sentMessage: "A little cheer for them today.",
    receivedTitle: (partnerName) => `${partnerName} is proud of you`,
    receivedMessage: "A little cheer, just for you.",
  },
} as const satisfies Record<PresencePulseTypeValue, PresencePulseDetails>;

export const PRESENCE_PULSE_OPTIONS_LIST: ({ type: PresencePulseTypeValue } & PresencePulseDetails)[] =
  PRESENCE_PULSE_TYPES.map((type) => ({
    type,
    ...PRESENCE_PULSE_OPTIONS[type],
  }));

export const RECENT_PULSE_WINDOW_MS = 60 * 60 * 1000;
