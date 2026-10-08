import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorBanner } from '@/components/ErrorBanner';
import { getStats } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Station Statistics</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Last 30 Days</ThemedText>
        </View>

        <ErrorBanner message={error} />

        {stats && (
          <>
            <ThemedView type="backgroundElement" style={styles.kpiCard}>
              <ThemedText type="subtitle" style={styles.kpiValue}>
                {((stats.contaminationRate ?? stats.contamination_rate ?? 0)).toFixed(1)}%
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">Average Contamination</ThemedText>
            </ThemedView>

            <View style={styles.gridRow}>
              <ThemedView type="backgroundElement" style={styles.gridItem}>
                <ThemedText type="title" style={{ color: theme.pass }}>{stats.passCount ?? stats.pass_count ?? 0}</ThemedText>
                <ThemedText type="smallBold">PASS</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.gridItem}>
                <ThemedText type="title" style={{ color: theme.hold }}>{stats.holdCount ?? stats.hold_count ?? 0}</ThemedText>
                <ThemedText type="smallBold">HOLD</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.gridItem}>
                <ThemedText type="title" style={{ color: theme.reject }}>{stats.rejectCount ?? stats.reject_count ?? 0}</ThemedText>
                <ThemedText type="smallBold">REJECT</ThemedText>
              </ThemedView>
            </View>

            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="smallBold">Total Inspections</ThemedText>
              <ThemedText type="subtitle">{stats.totalInspections ?? stats.total_inspections ?? 0}</ThemedText>
            </ThemedView>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { alignItems: 'center' },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: { marginBottom: Spacing.two },
  kpiCard: {
    padding: Spacing.five,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  kpiValue: { fontSize: 48, lineHeight: 56, color: '#F57F17' }, // Warning color
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  gridItem: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.two,
  },
});
