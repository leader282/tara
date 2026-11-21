import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from "expo-camera";

import { AppText, Button, Icon, type IconName } from "@/components/ui";
import { MEDIA_MAX_VIDEO_SECONDS } from "@/features/media/constants";
import type { PickedMedia } from "@/features/media/types";
import { colors, radii, spacing } from "@/theme/tokens";

type CaptureMode = "picture" | "video";

type CameraCaptureModalProps = {
  visible: boolean;
  // How many more photos or videos fit in the answer or capsule.
  maxItems: number;
  onClose: () => void;
  onDone: (items: PickedMedia[]) => void;
};

const MAX_VIDEO_MS = MEDIA_MAX_VIDEO_SECONDS * 1000;

export function formatClipSeconds(durationMs: number): string {
  return `0:${String(Math.min(Math.round(durationMs / 1000), 59)).padStart(2, "0")}`;
}

// Camera controls sit on a dark backing so they stay visible over any picture.
function CameraControl({
  accessibilityLabel,
  icon,
  onPress,
  disabled = false,
}: {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed ? styles.controlPressed : null, disabled ? styles.shutterDisabled : null]}
    >
      <Icon name={icon} size={22} tintColor={colors.inkText} />
    </Pressable>
  );
}

export function CameraCaptureModal({ visible, maxItems, onClose, onDone }: CameraCaptureModalProps) {
  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      {/* Mounted only while open, so the camera is released as soon as it closes. */}
      {visible ? <CameraCapture maxItems={maxItems} onClose={onClose} onDone={onDone} /> : null}
    </Modal>
  );
}

function CameraCapture({ maxItems, onClose, onDone }: Omit<CameraCaptureModalProps, "visible">) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const [hasFallenBack, setHasFallenBack] = useState(false);
  const [mode, setMode] = useState<CaptureMode>("picture");
  const [isReady, setIsReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [captured, setCaptured] = useState<PickedMedia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const isRecording = recordingStartedAt !== null;
  const remaining = maxItems - captured.length;

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    if (recordingStartedAt === null) {
      return;
    }

    const timer = setInterval(() => setElapsedMs(Date.now() - recordingStartedAt), 100);
    return () => clearInterval(timer);
  }, [recordingStartedAt]);

  const close = () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
    }

    if (captured.length === 0) {
      onClose();
      return;
    }

    Alert.alert(
      captured.length === 1 ? "Discard this capture?" : `Discard these ${captured.length} captures?`,
      "They haven't been added yet.",
      [
        { text: "Keep", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: onClose },
      ]
    );
  };

  const addCaptured = (item: PickedMedia) => {
    setNotice(null);
    setCaptured((current) => (current.length < maxItems ? [...current, item] : current));
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isTakingPhoto) {
      return;
    }

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, exif: false });
      if (photo?.uri) {
        addCaptured({
          uri: photo.uri,
          kind: "image",
          mimeType: "image/jpeg",
          width: photo.width || null,
          height: photo.height || null,
          fileSize: null,
          durationMs: null,
        });
      }
    } catch {
      setNotice("We couldn't take that photo. Please try again.");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) {
      return;
    }

    if (isRecording) {
      cameraRef.current.stopRecording();
      return;
    }

    const startedAt = Date.now();
    setElapsedMs(0);
    setRecordingStartedAt(startedAt);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: MEDIA_MAX_VIDEO_SECONDS });
      if (video?.uri) {
        addCaptured({
          uri: video.uri,
          kind: "video",
          mimeType: video.uri.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4",
          width: null,
          height: null,
          fileSize: null,
          durationMs: Math.min(Math.max(Date.now() - startedAt, 1), MAX_VIDEO_MS),
        });
      }
    } catch {
      setNotice("We couldn't record that video. Please try again.");
    } finally {
      setRecordingStartedAt(null);
    }
  };

  const switchMode = async (nextMode: CaptureMode) => {
    if (nextMode === mode || isRecording) {
      return;
    }

    setMode(nextMode);
    if (nextMode === "video" && microphonePermission && !microphonePermission.granted && microphonePermission.canAskAgain) {
      await requestMicrophonePermission();
    }
  };

  if (!cameraPermission) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.inkText} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={[styles.root, styles.centered, styles.permission, { paddingTop: insets.top }]}>
        <Icon name="camera-outline" size={40} tintColor={colors.inkText} />
        <AppText align="center" style={styles.lightText} variant="headline">
          Allow camera access
        </AppText>
        <AppText align="center" style={styles.mutedText} variant="body">
          Tara needs your camera to take photos and short videos for your partner.
        </AppText>
        <Button
          onPress={() => {
            if (cameraPermission.canAskAgain) {
              void requestCameraPermission();
            } else {
              void Linking.openSettings();
            }
          }}
          title={cameraPermission.canAskAgain ? "Allow camera" : "Open settings"}
        />
        <Button onPress={onClose} title="Not now" variant="inverse" />
      </View>
    );
  }

  const shutterLabel =
    mode === "picture" ? "Take photo" : isRecording ? "Stop recording" : "Start recording";
  const canCapture = isReady && (isRecording || (remaining > 0 && !isTakingPhoto));

  return (
    <View style={styles.root}>
      <CameraView
        facing={facing}
        mode={mode}
        mute={!microphonePermission?.granted}
        onCameraReady={() => setIsReady(true)}
        onMountError={() => {
          // Some phones and tablets have no front camera; use the other one once.
          if (hasFallenBack) {
            setNotice("We couldn't open the camera. Please try again.");
            return;
          }
          setHasFallenBack(true);
          setFacing((current) => (current === "front" ? "back" : "front"));
        }}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        videoQuality="720p"
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <CameraControl accessibilityLabel="Close camera" icon="close" onPress={close} />
        <View style={styles.topCenter}>
          {isRecording ? (
            <View style={styles.recordingPill}>
              <View style={styles.recordingDot} />
              <AppText style={styles.lightText} variant="label">
                {formatClipSeconds(elapsedMs)} / {formatClipSeconds(MAX_VIDEO_MS)}
              </AppText>
            </View>
          ) : null}
        </View>
        <CameraControl
          accessibilityLabel="Switch camera"
          disabled={isRecording}
          icon="camera-reverse-outline"
          onPress={() => setFacing((current) => (current === "front" ? "back" : "front"))}
        />
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + spacing.lg }]}>
        {notice ? (
          <AppText align="center" style={styles.lightText} variant="caption">
            {notice}
          </AppText>
        ) : null}
        {remaining <= 0 && !isRecording ? (
          <AppText align="center" style={styles.lightText} variant="caption">
            That&apos;s the most you can add here.
          </AppText>
        ) : null}
        {mode === "video" && !microphonePermission?.granted ? (
          <AppText align="center" style={styles.mutedText} variant="caption">
            Recording without sound. Allow the microphone in settings to add sound.
          </AppText>
        ) : null}

        {captured.length > 0 ? (
          <ScrollView contentContainerStyle={styles.strip} horizontal showsHorizontalScrollIndicator={false}>
            {captured.map((item, index) => (
              <View key={item.uri} style={styles.stripItem}>
                {item.kind === "image" ? (
                  <Image source={{ uri: item.uri }} style={styles.stripImage} />
                ) : (
                  <View style={[styles.stripImage, styles.stripVideo]}>
                    <Icon name="play" size={18} tintColor={colors.inkText} />
                    <AppText style={styles.lightText} variant="caption">
                      {formatClipSeconds(item.durationMs ?? 0)}
                    </AppText>
                  </View>
                )}
                <Pressable
                  accessibilityLabel={`Remove capture ${index + 1}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setCaptured((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  style={styles.stripRemove}
                >
                  <Icon name="close" size={12} tintColor={colors.textInverse} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.modes}>
          {(["picture", "video"] as const).map((option) => (
            <Pressable
              accessibilityLabel={option === "picture" ? "Photo mode" : "Video mode"}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === option, disabled: isRecording }}
              disabled={isRecording}
              key={option}
              onPress={() => void switchMode(option)}
              style={[styles.modeOption, mode === option ? styles.modeOptionActive : null]}
            >
              <AppText style={mode === option ? styles.modeTextActive : styles.lightText} variant="label">
                {option === "picture" ? "Photo" : `Video · ${MEDIA_MAX_VIDEO_SECONDS}s`}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.controlSide} />
          <Pressable
            accessibilityLabel={shutterLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCapture }}
            disabled={!canCapture}
            onPress={() => void (mode === "picture" ? takePhoto() : toggleRecording())}
            style={[styles.shutter, !canCapture ? styles.shutterDisabled : null]}
          >
            <View
              style={[
                styles.shutterInner,
                mode === "video" ? styles.shutterVideo : null,
                isRecording ? styles.shutterRecording : null,
              ]}
            />
            {isRecording ? (
              <View
                style={[styles.recordingProgress, { width: `${Math.min(elapsedMs / MAX_VIDEO_MS, 1) * 100}%` }]}
              />
            ) : null}
          </Pressable>
          <View style={styles.controlSide}>
            {captured.length > 0 && !isRecording ? (
              <Button
                accessibilityLabel={`Add ${captured.length} ${captured.length === 1 ? "capture" : "captures"}`}
                onPress={() => onDone(captured)}
                size="sm"
                title={`Add ${captured.length}`}
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#000000",
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  permission: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  lightText: {
    color: colors.inkText,
  },
  mutedText: {
    color: colors.inkMuted,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    left: 0,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: 0,
    top: 0,
  },
  topCenter: {
    alignItems: "center",
    flex: 1,
  },
  control: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  controlPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  recordingPill: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recordingDot: {
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  bottomPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    bottom: 0,
    gap: spacing.md,
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    position: "absolute",
    right: 0,
  },
  strip: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  stripItem: {
    paddingRight: spacing.xs,
    paddingTop: spacing.xs,
  },
  stripImage: {
    borderRadius: radii.sm,
    height: 56,
    width: 56,
  },
  stripVideo: {
    alignItems: "center",
    backgroundColor: colors.ink,
    justifyContent: "center",
  },
  stripRemove: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: radii.pill,
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    width: 20,
  },
  modes: {
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: radii.pill,
    flexDirection: "row",
    padding: spacing.xs,
  },
  modeOption: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modeOptionActive: {
    backgroundColor: colors.inkText,
  },
  modeTextActive: {
    color: colors.textPrimary,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
  },
  controlSide: {
    alignItems: "center",
    flex: 1,
  },
  shutter: {
    alignItems: "center",
    borderColor: colors.inkText,
    borderRadius: radii.pill,
    borderWidth: 4,
    height: 78,
    justifyContent: "center",
    overflow: "hidden",
    width: 78,
  },
  shutterDisabled: {
    opacity: 0.4,
  },
  shutterInner: {
    backgroundColor: colors.inkText,
    borderRadius: radii.pill,
    height: 60,
    width: 60,
  },
  shutterVideo: {
    backgroundColor: colors.danger,
  },
  shutterRecording: {
    borderRadius: radii.xs,
    height: 30,
    width: 30,
  },
  recordingProgress: {
    backgroundColor: colors.danger,
    bottom: 0,
    height: 4,
    left: 0,
    position: "absolute",
  },
});
