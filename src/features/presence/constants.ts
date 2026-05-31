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
  iconText?: string;
};

export const PRESENCE_PULSE_OPTIONS = {
  thinking_of_you: {
    label: "Thinking of you",
    shortLabel: "Thinking",
    description: "A gentle reminder that your partner is on your mind.",
    accessibilityLabel: "Send a thinking of you pulse",
    iconText: "heart",
  },
  miss_you: {
    label: "Miss you",
    shortLabel: "Miss you",
    description: "A soft way to say the distance feels a little bigger today.",
    accessibilityLabel: "Send a miss you pulse",
    iconText: "waves",
  },
  hug: {
    label: "Hug",
    shortLabel: "Hug",
    description: "A warm squeeze sent across the distance.",
    accessibilityLabel: "Send a hug pulse",
    iconText: "hug",
  },
  good_morning: {
    label: "Good morning",
    shortLabel: "Morning",
    description: "A calm start to your partner's day.",
    accessibilityLabel: "Send a good morning pulse",
    iconText: "sun",
  },
  good_night: {
    label: "Good night",
    shortLabel: "Night",
    description: "A gentle close to the day before sleep.",
    accessibilityLabel: "Send a good night pulse",
    iconText: "moon",
  },
  safe_arrived: {
    label: "Arrived safely",
    shortLabel: "Safe",
    description: "A reassuring check-in that you made it safely.",
    accessibilityLabel: "Send an arrived safely pulse",
    iconText: "check",
  },
  proud_of_you: {
    label: "Proud of you",
    shortLabel: "Proud",
    description: "A small note of support and encouragement.",
    accessibilityLabel: "Send a proud of you pulse",
    iconText: "star",
  },
} as const satisfies Record<PresencePulseTypeValue, PresencePulseDetails>;

export const PRESENCE_PULSE_OPTIONS_LIST: (
  { type: PresencePulseTypeValue } & PresencePulseDetails
)[] = PRESENCE_PULSE_TYPES.map((type) => ({
  type,
  ...PRESENCE_PULSE_OPTIONS[type],
}));
