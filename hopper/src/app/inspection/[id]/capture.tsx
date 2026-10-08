import { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { uploadMedia } from '@/lib/api';

const GUIDED_PROMPTS = [
  'Top view',
  'Side view',
  'Close-up of suspicious area',
  'Surface mix',
  'Optional extra'
];

export default function CaptureScreen() {
  const { id: inspectionId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [images, setImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <ThemedText type="subtitle" style={styles.centerText}>Camera Access Required</ThemedText>
        <ThemedText style={[styles.centerText, styles.permissionText]} themeColor="textSecondary">
          We need access to your camera to capture waste load images for inspection.
        </ThemedText>
        <PrimaryButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (images.length >= 5) return;
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo?.uri) {
          setImages((prev) => [...prev, photo.uri]);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to capture image');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    if (images.length === 0) return;
    // Pass images to the next screen via query or state. 
    // Router query limit is small, so we might need a global store or context if images are huge.
    // For now, we will upload them here or pass URIs encoded in router params.
    // Given the flow, passing URIs as JSON string should be okay for local paths.
    router.replace({
      pathname: `/inspection/[id]/review` as any,
      params: { id: inspectionId, images: JSON.stringify(images) }
    });
  };

  const currentPrompt = GUIDED_PROMPTS[Math.min(images.length, GUIDED_PROMPTS.length - 1)];

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing="back"
      />
      
      {/* Top overlay */}
      <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top, Spacing.four) }]}>
        <View style={styles.promptChip}>
          <ThemedText type="smallBold" style={styles.promptText}>{currentPrompt}</ThemedText>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <ThemedText type="smallBold" style={styles.closeText}>Close</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        
        {/* Thumbnails */}
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
            {images.map((uri, idx) => (
              <TouchableOpacity key={idx} onPress={() => removeImage(idx)} style={styles.thumbnailWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <View style={styles.removeBadge}>
                  <Text style={styles.removeText}>X</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.sideBtn} onPress={pickImage}>
            <ThemedText type="smallBold" style={styles.sideBtnText}>Gallery</ThemedText>
          </TouchableOpacity>

          <View style={styles.shutterContainer}>
            <TouchableOpacity 
              style={[styles.shutterBtn, images.length >= 5 && styles.shutterDisabled]} 
              onPress={takePicture}
              disabled={images.length >= 5 || isCapturing}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <Text style={styles.counterText}>{images.length} / 5</Text>
          </View>

          <TouchableOpacity 
            style={[styles.sideBtn, images.length === 0 && styles.disabledSideBtn]} 
            onPress={handleDone}
            disabled={images.length === 0}
          >
            <ThemedText type="smallBold" style={[styles.sideBtnText, images.length === 0 && styles.disabledText]}>
              Done
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { justifyContent: 'center', padding: Spacing.five },
  centerText: { textAlign: 'center' },
  permissionText: { marginVertical: Spacing.four },
  camera: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
  },
  promptChip: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
  },
  promptText: { color: '#FFF' },
  closeBtn: {
    position: 'absolute',
    right: Spacing.four,
    top: Spacing.four + 40, // Adjust for notch
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  closeText: { color: '#FFF' },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: Spacing.three,
  },
  thumbnailContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
  },
  sideBtn: {
    width: 70,
    alignItems: 'center',
  },
  sideBtnText: { color: '#FFF', fontSize: 16 },
  disabledSideBtn: { opacity: 0.5 },
  disabledText: { color: '#999' },
  shutterContainer: { alignItems: 'center' },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  shutterDisabled: { opacity: 0.5 },
  counterText: {
    color: '#FFF',
    marginTop: Spacing.one,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
