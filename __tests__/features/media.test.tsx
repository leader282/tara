import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { PickedMedia } from "@/features/media/types";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const mockReserveMediaAsset = jest.fn<(input: unknown) => Promise<unknown>>();
const mockUploadMediaFile = jest.fn<(input: unknown) => Promise<void>>();
const mockUploadMediaObject = jest.fn<(input: unknown) => Promise<void>>();
const mockMarkMediaAssetUploaded = jest.fn<(input: unknown) => Promise<unknown>>();
const mockMarkMediaAssetFailed = jest.fn<(input: unknown) => Promise<unknown>>();

jest.mock("@/features/media/api/storageApi", () => ({
  reserveMediaAsset: (input: unknown) => mockReserveMediaAsset(input),
  uploadMediaFile: (input: unknown) => mockUploadMediaFile(input),
  uploadMediaObject: (input: unknown) => mockUploadMediaObject(input),
  markMediaAssetUploaded: (input: unknown) => mockMarkMediaAssetUploaded(input),
  markMediaAssetFailed: (input: unknown) => mockMarkMediaAssetFailed(input),
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: async () => ({ exists: true, isDirectory: false, size: 2_400_000 }),
  readAsStringAsync: async () => "/9j/4A==",
  EncodingType: { Base64: "base64" },
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: async () => ({ uri: "file:///processed.jpg", width: 1200, height: 900 }),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  useMicrophonePermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
}));

const mockPickMediaFromLibrary = jest.fn<(limit: number) => Promise<unknown>>();
jest.mock("@/features/media/services/mediaLibrary", () => {
  const actual = jest.requireActual<typeof import("@/features/media/services/mediaLibrary")>(
    "@/features/media/services/mediaLibrary"
  );
  return { ...actual, pickMediaFromLibrary: (limit: number) => mockPickMediaFromLibrary(limit) };
});

import { MediaGalleryField } from "@/features/media/components/MediaGalleryField";
import { describeMediaItem } from "@/features/media/components/MediaGallery";
import { mediaAssetIdsSchema } from "@/features/media/schemas";
import { toPickedLibraryMedia } from "@/features/media/services/mediaLibrary";
import { uploadPickedMedia } from "@/features/media/services/uploadMedia";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const video: PickedMedia = {
  uri: "file:///clip.mp4",
  kind: "video",
  mimeType: "video/mp4",
  width: 720,
  height: 1280,
  fileSize: null,
  durationMs: 4_800,
};

const photo = (n: number): PickedMedia => ({
  uri: `file:///photo-${n}.jpg`,
  kind: "image",
  mimeType: "image/jpeg",
  width: 4000,
  height: 3000,
  fileSize: 3_000_000,
  durationMs: null,
});

describe("choosing from the library", () => {
  it("keeps photos and short videos, and counts videos that are too long", () => {
    const result = toPickedLibraryMedia([
      { uri: "file:///a.heic", type: "image", width: 100, height: 100, mimeType: "image/heic" },
      { uri: "file:///b.mp4", type: "video", width: 720, height: 1280, duration: 5_020, mimeType: "video/mp4" },
      { uri: "file:///c.mov", type: "video", width: 720, height: 1280, duration: 12_000 },
      { uri: "file:///d.webm", type: "video", width: 720, height: 1280, duration: 3_000, mimeType: "video/webm" },
    ] as never);

    expect(result.items.map((item) => [item.uri, item.kind, item.mimeType])).toEqual([
      ["file:///a.heic", "image", "image/jpeg"],
      ["file:///b.mp4", "video", "video/mp4"],
    ]);
    expect(result.skippedTooLong).toBe(1);
    expect(result.skippedOther).toBe(1);
  });

  it("allows at most 5 different items per answer or capsule", () => {
    expect(mediaAssetIdsSchema.safeParse([1, 2, 3, 4, 5].map(uuid)).success).toBe(true);
    expect(mediaAssetIdsSchema.safeParse([1, 2, 3, 4, 5, 6].map(uuid)).success).toBe(false);
    expect(mediaAssetIdsSchema.safeParse([uuid(1), uuid(1)]).success).toBe(false);
  });

  it("describes each item for screen readers", () => {
    expect(describeMediaItem("Your ritual", { media_type: "image" }, 0, 1)).toBe("Your ritual photo");
    expect(describeMediaItem("Capsule", { media_type: "video" }, 1, 3)).toBe("Capsule video 2 of 3");
  });
});

describe("uploading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReserveMediaAsset.mockResolvedValue({ id: uuid(1), storage_path: "couple/me/1.mp4" });
    mockUploadMediaFile.mockResolvedValue(undefined);
    mockMarkMediaAssetUploaded.mockResolvedValue({ id: uuid(1) });
    mockMarkMediaAssetFailed.mockResolvedValue(null);
  });

  it("streams a short video straight from the file", async () => {
    await uploadPickedMedia({ media: video, purpose: "ritual_completion" });

    expect(mockReserveMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "video/mp4", durationMs: 4_800, sizeBytes: 2_400_000 })
    );
    expect(mockUploadMediaFile).toHaveBeenCalledWith({
      storagePath: "couple/me/1.mp4",
      fileUri: "file:///clip.mp4",
      contentType: "video/mp4",
    });
    expect(mockUploadMediaObject).not.toHaveBeenCalled();
    expect(mockMarkMediaAssetUploaded).toHaveBeenCalledWith(expect.objectContaining({ sizeBytes: 2_400_000 }));
  });

  it("rejects videos longer than 5 seconds before uploading anything", async () => {
    await expect(
      uploadPickedMedia({ media: { ...video, durationMs: 9_000 }, purpose: "ritual_completion" })
    ).rejects.toMatchObject({ code: "video_too_long" });
    expect(mockReserveMediaAsset).not.toHaveBeenCalled();
  });

  it("marks the reservation as failed when the upload breaks", async () => {
    mockUploadMediaFile.mockRejectedValue(new Error("network down"));

    await expect(uploadPickedMedia({ media: video, purpose: "memory_capsule_content" })).rejects.toMatchObject({
      code: "network_error",
    });
    expect(mockMarkMediaAssetFailed).toHaveBeenCalledWith({ mediaAssetId: uuid(1) });
  });
});

function renderField(element: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>{element}</SafeAreaProvider>);
}

describe("the photo and video field", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let nextId = 0;
    mockReserveMediaAsset.mockImplementation(async () => {
      nextId += 1;
      return { id: uuid(nextId), storage_path: `couple/me/${nextId}.jpg` };
    });
    mockUploadMediaObject.mockResolvedValue(undefined);
    mockMarkMediaAssetUploaded.mockImplementation(async (input) => ({
      id: (input as { mediaAssetId: string }).mediaAssetId,
    }));
  });

  it("uploads what you pick and reports the items in order", async () => {
    let finishUploads = () => {};
    const uploadsFinished = new Promise<void>((resolve) => {
      finishUploads = resolve;
    });
    mockUploadMediaObject.mockImplementation(() => uploadsFinished);
    mockPickMediaFromLibrary.mockResolvedValue({ items: [photo(1), photo(2)], skippedTooLong: 0, skippedOther: 0 });
    const onChange = jest.fn();
    const onUploadingChange = jest.fn();
    renderField(<MediaGalleryField onChange={onChange} onUploadingChange={onUploadingChange} purpose="ritual_completion" />);

    fireEvent.press(screen.getByLabelText("Choose from your library"));

    await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(true));
    expect(mockPickMediaFromLibrary).toHaveBeenCalledWith(5);
    expect(screen.getAllByLabelText("Uploading")).toHaveLength(2);
    expect(screen.getByText("2/5")).toBeTruthy();

    await act(async () => {
      finishUploads();
    });

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([uuid(1), uuid(2)]));
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByLabelText("Uploading")).toBeNull();
  });

  it("shows replace and delete for a selected item", async () => {
    mockPickMediaFromLibrary.mockResolvedValue({ items: [photo(1), photo(2)], skippedTooLong: 0, skippedOther: 0 });
    const onChange = jest.fn();
    renderField(<MediaGalleryField onChange={onChange} purpose="ritual_completion" />);
    fireEvent.press(screen.getByLabelText("Choose from your library"));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([uuid(1), uuid(2)]));

    expect(screen.queryByText("Delete")).toBeNull();
    fireEvent.press(screen.getByLabelText("Attached photo 1"));
    expect(screen.getByText("Replace")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText("Delete"));
    });
    expect(onChange).toHaveBeenLastCalledWith([uuid(2)]);
  });

  it("explains why a long video wasn't added", async () => {
    mockPickMediaFromLibrary.mockResolvedValue({ items: [], skippedTooLong: 1, skippedOther: 0 });
    renderField(<MediaGalleryField onChange={jest.fn()} purpose="memory_capsule_content" />);

    fireEvent.press(screen.getByLabelText("Choose from your library"));

    expect(await screen.findByText("That video is longer than 5 seconds, so it wasn't added.")).toBeTruthy();
  });
});
