import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EvidenceImage } from '@/components/EvidenceImage';
import { getInspection } from '@/lib/api';
import { Inspection, Media } from '@/lib/types';
import { Spacing } from '@/constants/theme';

export default function MediaViewerScreen() {
  const { id: inspectionId, mediaId } = useLocalSearchParams<{ id: string, mediaId: string }>();
  const insets = useSafeAreaInsets();

  const [inspection, setInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const insp = await getInspection(inspectionId);
        setInspection(insp);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [inspectionId]);

  if (!inspection) {
    return <View style={styles.container} />;
  }

  const media = inspection.media?.find(m => m.id === mediaId);
  const detections = inspection.detections?.filter(d => d.mediaId === mediaId || d.media_id === mediaId) || media?.detections || [];

  if (!media) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={[styles.closeBtn, { top: Math.max(insets.top, Spacing.four) }]} onPress={() => router.back()}>
          <ThemedText style={styles.closeText}>Close</ThemedText>
        </TouchableOpacity>
        <ThemedText style={{ color: '#fff' }}>Media not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.closeBtn, { top: Math.max(insets.top, Spacing.four) }]} onPress={() => router.back()}>
        <ThemedText style={styles.closeText}>Close</ThemedText>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <EvidenceImage 
          imageUrl={media.annotatedUrl || media.annotated_url || media.originalUrl || media.original_url || ''}
          detections={detections}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.four,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  closeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
