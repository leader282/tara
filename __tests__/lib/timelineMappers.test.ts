import { describe, expect, it } from "@jest/globals";

import { parseTimelinePayload } from "@/features/timeline/mappers";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("timeline payload mappers", () => {
  it("does not crash on unknown timeline types", () => {
    expect(() => parseTimelinePayload("new_type_from_future", { foo: "bar" })).not.toThrow();

    const payload = parseTimelinePayload("new_type_from_future", { foo: "bar" });
    expect(payload.type).toBe("unknown");
    expect(payload.value).toEqual({});
  });

  it("does not expose raw malformed JSON-like payloads", () => {
    const payload = parseTimelinePayload("presence_sent", "{\"note\":\"private\"}");

    expect(payload.type).toBe("presence_sent");
    expect(payload.value).toEqual({});
  });

  it("removes capsule note content from parsed payload", () => {
    const payload = parseTimelinePayload("capsule_created", {
      capsule_id: UUID,
      note: "this should never appear",
      has_note: true,
    });

    expect(payload.type).toBe("capsule_created");
    expect(payload.value).toEqual({
      capsule_id: UUID,
      has_note: true,
    });
  });

  it("removes ritual response text from parsed payload", () => {
    const payload = parseTimelinePayload("ritual_completed", {
      couple_ritual_id: UUID,
      response_text: "private response",
    });

    expect(payload.type).toBe("ritual_completed");
    expect(payload.value).toEqual({
      couple_ritual_id: UUID,
    });
  });
});
