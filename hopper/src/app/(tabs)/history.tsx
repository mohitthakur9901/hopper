import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { InspectionCard } from '@/components/InspectionCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { listInspections } from '@/lib/api';
import { Inspection } from '@/lib/types';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FILTERS = ['All', 'PASS', 'HOLD', 'REJECT'];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [filter, setFilter] = useState('All');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      // Our API mock doesn't handle real filtering by decision yet, we can filter client-side for now
      // Real API might take a ?decision=... param
      const data = await listInspections(1);
      if (filter === 'All') {
        setInspections(data);
      } else {
        setInspections(data.filter(i => i.decision === filter));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.four }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">History</ThemedText>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable 
            key={f} 
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip, 
              { backgroundColor: filter === f ? theme.text : theme.backgroundElement }
            ]}
          >
            <ThemedText type="smallBold" style={{ color: filter === f ? theme.background : theme.text }}>
              {f}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ErrorBanner message={error} />

      <FlatList
        data={inspections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
        renderItem={({ item }) => <InspectionCard inspection={item} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState 
              title="No inspections found" 
              description={`There are no inspections matching '${filter}'.`} 
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
