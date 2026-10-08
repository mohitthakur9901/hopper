import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusStepper } from '@/components/StatusStepper';
import { ErrorBanner } from '@/components/ErrorBanner';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { uploadMedia, analyzeInspection, getInspection, extractErrorMessage } from '@/lib/api';
import { Status } from '@/lib/types';

import { useInspectionStore } from '@/store/inspectionStore';

export default function ProcessingScreen() {
  const { id: inspectionId } = useLocalSearchParams<{ id: string }>();
  const images = useInspectionStore((state) => state.images);
  const clearImages = useInspectionStore((state) => state.clearImages);
  
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [status, setStatus] = useState<Status>('UPLOADING');
  const [error, setError] = useState<string | null>(null);
  
  const uploadCompleted = useRef(false);

  useEffect(() => {
    startProcess();
  }, []);

  const startProcess = async () => {
    setError(null);
    try {
      // Upload is already completed in new.tsx via presigned URLs
      
      // 1. Trigger Analysis
      setStatus('PROCESSING');
      await analyzeInspection(inspectionId);

      // 3. Poll for completion
      pollResult();
    } catch (err) {
      setStatus('FAILED');
      setError(extractErrorMessage(err));
    }
  };

  const pollResult = async () => {
    let attempts = 0;
    const maxAttempts = 40; // ~60 seconds with 1.5s interval
    
    const interval = setInterval(async () => {
      try {
        attempts++;
        const insp = await getInspection(inspectionId);
        
        if (insp.status === 'COMPLETED') {
          clearInterval(interval);
          setStatus('COMPLETED');
          router.replace(`/inspection/${inspectionId}/result` as any);
        } else if (insp.status === 'FAILED') {
          clearInterval(interval);
          setStatus('FAILED');
          setError('Backend reported an analysis failure.');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus('FAILED');
          setError('Processing timed out. Please try again.');
        }
      } catch (err) {
        clearInterval(interval);
        setStatus('FAILED');
        setError(extractErrorMessage(err));
      }
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Processing</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Please wait while our AI analyzes the load.</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <StatusStepper currentStatus={status} error={status === 'FAILED'} />
        </ThemedView>

        <ErrorBanner message={error} />
      </View>

      {status === 'FAILED' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
          <PrimaryButton 
            title="Retry Analysis" 
            onPress={startProcess} 
            style={{ marginBottom: Spacing.three }}
          />
          <PrimaryButton 
            title="Save & Exit" 
            onPress={() => router.replace('/')} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.four },
  content: {
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginBottom: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
