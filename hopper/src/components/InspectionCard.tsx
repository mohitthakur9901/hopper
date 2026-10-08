import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { DecisionBadge } from './DecisionBadge';
import { Inspection } from '@/lib/types';
import { Spacing } from '@/constants/theme';

export function InspectionCard({ inspection }: { inspection: Inspection }) {
  const thumbnail = inspection.media?.[0]?.annotatedUrl || inspection.media?.[0]?.annotated_url || inspection.media?.[0]?.originalUrl || inspection.media?.[0]?.original_url;

  return (
    <Pressable
      onPress={() => router.push(`/inspection/${inspection.id}/result` as any)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.container}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={styles.thumbnail} />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="smallBold">{inspection.id}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {(inspection.createdAt || inspection.created_at) 
                ? new Date(inspection.createdAt || inspection.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </ThemedText>
          </View>
          <View style={styles.footer}>
            <DecisionBadge decision={inspection.decision} />
            {(inspection.contaminationScore !== undefined || inspection.contamination_score !== undefined) && (
              <ThemedText type="smallBold" themeColor="textSecondary">
                Score: {inspection.contaminationScore ?? inspection.contamination_score}
              </ThemedText>
            )}
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#ccc', // Placeholder color
  },
  content: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
