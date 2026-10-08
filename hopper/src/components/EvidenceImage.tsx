import { StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Detection } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

export function EvidenceImage({ 
  imageUrl, 
  detections, 
  onPress 
}: { 
  imageUrl: string; 
  detections: Detection[];
  onPress?: () => void;
}) {
  const theme = useTheme();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout);
  };

  return (
    <Pressable onPress={onPress} style={styles.container} onLayout={onLayout}>
      <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
      {layout.width > 0 && detections.map(det => {
        // Assuming x,y,width,height are normalized 0-1
        const left = det.x * layout.width;
        const top = det.y * layout.height;
        const width = det.width * layout.width;
        const height = det.height * layout.height;

        const color = det.severity === 'CRITICAL' || det.severity === 'HIGH' ? '#B71C1C' : '#F57F17';

        return (
          <View 
            key={det.id} 
            style={[
              styles.bbox, 
              { left, top, width, height, borderColor: color }
            ]}
          />
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4/3,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(255,0,0,0.1)',
  }
});
