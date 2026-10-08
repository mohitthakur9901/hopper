import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScoreRing } from '@/components/ScoreRing';
import { DetectionRow } from '@/components/DetectionRow';
import { EvidenceImage } from '@/components/EvidenceImage';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getInspection } from '@/lib/api';
import { Inspection } from '@/lib/types';

export default function ResultScreen() {
  const { id: inspectionId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const insp = await getInspection(inspectionId);
        setInspection(insp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [inspectionId]);

  if (loading || !inspection) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const allDetections = inspection.detections || inspection.media?.flatMap(m => m.detections || []) || [];
  const bgColor = inspection.decision === 'PASS' ? theme.pass : inspection.decision === 'HOLD' ? theme.hold : theme.reject;
  const textColor = inspection.decision === 'PASS' ? theme.onPass : inspection.decision === 'HOLD' ? theme.onHold : theme.onReject;

  return (
    <ScrollView 
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.four }
      ]}
    >
      <View style={[styles.heroBanner, { backgroundColor: bgColor }]}>
        <ThemedText type="title" style={{ color: textColor }}>{inspection.decision}</ThemedText>
        <ThemedText type="smallBold" style={{ color: textColor }}>
          Inspection {inspection.id}
        </ThemedText>
      </View>

      <View style={styles.body}>
        <View style={styles.scoreSection}>
          <ScoreRing score={inspection.contaminationScore ?? inspection.contamination_score ?? 0} />
          <View style={styles.scoreDetails}>
            <ThemedText type="subtitle">Contamination Score</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Processed in {((inspection.processingTimeMs ?? inspection.processing_time_ms ?? 0) / 1000).toFixed(1)} s
            </ThemedText>
          </View>
        </View>

        {inspection.decision === 'REJECT' && allDetections.some(d => d.severity === 'CRITICAL') && (
          <View style={styles.hazardCallout}>
            <ThemedText type="smallBold" style={{ color: theme.onReject }}>
              ⚠️ Hazard override active
            </ThemedText>
          </View>
        )}

        {(inspection.media?.length || 0) > 0 && (
          <View style={styles.evidenceSection}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Evidence</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {inspection.media?.map((m) => (
                <View key={m.id} style={styles.carouselItem}>
                  <EvidenceImage 
                    imageUrl={m.annotatedUrl || m.annotated_url || m.originalUrl || m.original_url || ''}
                    detections={allDetections.filter(d => d.mediaId === m.id || d.media_id === m.id || (d as any).media_id === m.id)}
                    onPress={() => router.push(`/inspection/${inspection.id}/media/${m.id}` as any)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.detectionsSection}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Detections</ThemedText>
          {allDetections.length === 0 ? (
            <ThemedText type="default" themeColor="textSecondary">No issues detected.</ThemedText>
          ) : (
            allDetections.map(d => (
              <DetectionRow key={d.id} detection={d} />
            ))
          )}
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="New Inspection" onPress={() => router.replace('/inspection/new' as any)} style={styles.actionBtn} />
          <PrimaryButton title="Back to History" onPress={() => router.replace('/(tabs)/history' as any)} style={styles.actionBtn} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  heroBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    borderBottomLeftRadius: Spacing.three,
    borderBottomRightRadius: Spacing.three,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  scoreDetails: {
    flex: 1,
  },
  hazardCallout: {
    backgroundColor: '#FFEBEE', // light red
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#B71C1C',
  },
  evidenceSection: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  carousel: {
    gap: Spacing.three,
  },
  carouselItem: {
    width: 280,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  detectionsSection: {
    marginTop: Spacing.two,
  },
  actions: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  actionBtn: {
    backgroundColor: '#3c87f7',
  }
});
