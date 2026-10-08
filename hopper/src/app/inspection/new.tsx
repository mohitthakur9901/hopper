import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useInspectionStore } from '@/store/inspectionStore';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function NewInspectionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Camera & Image state from Zustand
  const { images, addImage, removeImage, clearImages } = useInspectionStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);



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
          addImage(photo.uri);
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
      addImage(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="linkPrimary">Cancel</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">New Inspection</ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <ThemedText style={{ textAlign: 'center', marginBottom: Spacing.three }}>
              Camera access is required.
            </ThemedText>
            <PrimaryButton title="Grant Permission" onPress={requestPermission} />
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                <ThemedText type="smallBold" style={styles.galleryText}>Gallery</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shutterBtn, (images.length >= 5 || isCapturing) && styles.shutterDisabled]} 
                onPress={takePicture}
                disabled={images.length >= 5 || isCapturing}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailContainer}>
            {images.map((uri, idx) => (
              <TouchableOpacity key={idx} onPress={() => removeImage(idx)} style={styles.thumbnailWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <View style={styles.removeBadge}>
                  <ThemedText style={styles.removeText}>X</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {images.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
          <PrimaryButton 
            title="Continue to Review" 
            onPress={() => router.push('/inspection/confirm' as any)} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backBtn: { padding: Spacing.one },
  headerPlaceholder: { width: 60 },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  title: { marginVertical: Spacing.four },
  stationList: { gap: Spacing.three },
  stationRow: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  pressed: { opacity: 0.8 },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: Spacing.five,
  },
  permissionContainer: { padding: Spacing.four, backgroundColor: '#f0f0f0', borderRadius: Spacing.two },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1 / 2,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: { flex: 1 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  galleryBtn: {
    position: 'absolute',
    left: Spacing.four,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  galleryText: { color: '#FFF' },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
  },
  shutterDisabled: { opacity: 0.5 },
  thumbnailContainer: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
