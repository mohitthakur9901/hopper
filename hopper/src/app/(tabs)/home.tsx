import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/PrimaryButton';
import { InspectionCard } from '@/components/InspectionCard';
import { ErrorBanner } from '@/components/ErrorBanner';
import { EmptyState } from '@/components/EmptyState';
import { listInspections, getStats } from '@/lib/api';
import { DashboardStats, Inspection } from '@/lib/types';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [inspectionsData, statsData] = await Promise.all([
        listInspections(1),
        getStats(),
      ]);
      setInspections(inspectionsData.slice(0, 3)); // Only show top 3 recent
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
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

  const handleNewInspection = () => {
    router.push('/inspection/new' as any);
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
          <ThemedText type="small" themeColor="textSecondary">Welcome back</ThemedText>
          <ThemedText type="subtitle">HopperAudit</ThemedText>
        </View>

        <PrimaryButton 
          title="New Inspection" 
          onPress={handleNewInspection} 
          style={styles.ctaButton} 
        />

        <ErrorBanner message={error} />

        {stats && (
          <ThemedView type="backgroundElement" style={styles.statsStrip}>
            <View style={styles.statItem}>
              <ThemedText type="subtitle" style={{ color: theme.pass }}>{stats.passCount ?? stats.pass_count ?? 0}</ThemedText>
              <ThemedText type="smallBold">PASS</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText type="subtitle" style={{ color: theme.hold }}>{stats.holdCount ?? stats.hold_count ?? 0}</ThemedText>
              <ThemedText type="smallBold">HOLD</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText type="subtitle" style={{ color: theme.reject }}>{stats.rejectCount ?? stats.reject_count ?? 0}</ThemedText>
              <ThemedText type="smallBold">REJECT</ThemedText>
            </View>
          </ThemedView>
        )}

        <View style={styles.recentSection}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>Recent Inspections</ThemedText>
          {loading && !refreshing ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.loadingText}>Loading...</ThemedText>
          ) : inspections.length > 0 ? (
            inspections.map((insp) => (
              <InspectionCard key={insp.id} inspection={insp} />
            ))
          ) : (
            <EmptyState 
              title="No recent inspections" 
              description="Tap 'New Inspection' to get started." 
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    marginBottom: Spacing.two,
  },
  ctaButton: {
    marginBottom: Spacing.two,
  },
  statsStrip: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#ccc',
  },
  recentSection: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
