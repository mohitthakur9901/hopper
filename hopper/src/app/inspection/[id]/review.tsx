import { useState } from 'react';
import { StyleSheet, View,TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ReviewScreen() {
  const { id: inspectionId, images: imagesParam } = useLocalSearchParams<{ id: string, images: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [images, setImages] = useState<string[]>(imagesParam ? JSON.parse(imagesParam) : []);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetake = () => {
    router.replace(`/inspection/${inspectionId}/capture` as any);
  };

  const handleSubmit = () => {
    router.replace({
      pathname: `/inspection/[id]/processing` as any,
      params: { id: inspectionId, images: JSON.stringify(images) }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Review Images</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Ensure the waste load is clearly visible.</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageCard}>
              <Image source={{ uri }} style={styles.image} contentFit="cover" />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <ThemedText style={styles.removeText}>X</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={[styles.imageCard, styles.addMoreBtn, { borderColor: theme.backgroundSelected }]} onPress={handleRetake}>
              <ThemedText type="smallBold">+</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Add photo</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        <PrimaryButton 
          title="Submit for Analysis" 
          onPress={handleSubmit} 
          disabled={images.length === 0} 
        />
      </View>
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
    paddingBottom: Spacing.six,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  imageCard: {
    width: '47%', // roughly two columns with gap
    aspectRatio: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#333',
  },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: '#FFF', fontWeight: 'bold' },
  addMoreBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
