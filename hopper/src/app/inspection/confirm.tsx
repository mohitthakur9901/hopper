import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { createInspection, uploadMedia } from '@/lib/api';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useInspectionStore } from '@/store/inspectionStore';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function ConfirmInspectionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  
  const { images, removeImage } = useInspectionStore();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError('Please capture at least one image before analyzing.');
      return;
    }
    
    setCreating(true);
    setError(null);
    try {
      // Backend doesn't actually use station_id right now, so we pass a dummy value
      const inspection = await createInspection('st-1');
      
      // Upload using the multipart/form-data endpoint in api.ts
      for (const uri of images) {
        await uploadMedia(inspection.id, uri);
      }
      
      router.replace(`/inspection/${inspection.id}/processing` as any);
    } catch (err: any) {
      setError(err.message || 'Failed to start inspection or upload images');
      setCreating(false);
    }
  };

  if (images.length === 0) {
    // If user somehow gets here with no images, redirect back
    router.replace('/inspection/new');
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="linkPrimary">Back</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">Review Images</ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>Confirm Upload ({images.length}/5)</ThemedText>
        
        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        <View style={styles.grid}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.gridItem}>
              <Image source={{ uri }} style={styles.image} />
              <Pressable onPress={() => removeImage(idx)} style={styles.removeBtn}>
                <ThemedText style={styles.removeText}>X</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        <PrimaryButton 
          title="Confirm & Upload" 
          onPress={handleSubmit} 
          disabled={creating || images.length === 0}
          loading={creating}
        />
      </View>
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
  errorText: { color: '#ff4444', marginBottom: Spacing.four },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
