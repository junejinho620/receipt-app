import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../styles';

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

export function PaginationDots({ count, activeIndex }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 5,
  },
  activeDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    backgroundColor: colors.textLight,
  },
});
