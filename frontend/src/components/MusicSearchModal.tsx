import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from './ui/Typography';
import { layout } from '../theme/layout';

export type iTunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string | null;
  collectionName?: string;
};

type MusicSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTrack: (track: iTunesTrack) => void;
};

export function MusicSearchModal({ visible, onClose, onSelectTrack }: MusicSearchModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<iTunesTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery);
      } else {
        setResults([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (term: string) => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    try {
      const formattedTerm = encodeURIComponent(term.trim());
      const url = `https://itunes.apple.com/search?term=${formattedTerm}&media=music&entity=song&limit=20&country=us`;
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results) throw new Error('Unexpected response format');
      setResults(data.results as iTunesTrack[]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Search timed out. Check your connection and try again.');
      } else {
        console.error('iTunes Search Error:', err);
        setError('Could not load results. Tap to retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (track: iTunesTrack) => {
    onSelectTrack(track);
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Typography variant="medium" color={colors.primary}>Cancel</Typography>
          </TouchableOpacity>
          <Typography variant="bold" size="h3" color={colors.textPrimary}>Music</Typography>
          <View style={{ width: 80 }} /> {/* balance */}
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists, songs..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.centerContainer} onPress={() => performSearch(searchQuery)}>
            <Feather name="wifi-off" size={32} color={colors.textTertiary} style={{ marginBottom: 12 }} />
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <Typography color={colors.textSecondary}>{error}</Typography>
            </View>
            <Typography variant="medium" color={colors.primary} style={{ marginTop: 12 }}>Tap to retry</Typography>
          </TouchableOpacity>
        ) : results.length === 0 && searchQuery.length > 1 ? (
          <View style={styles.centerContainer}>
            <Feather name="music" size={32} color={colors.textTertiary} style={{ marginBottom: 12 }} />
            <Typography color={colors.textSecondary}>No results found.</Typography>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Feather name="search" size={32} color={colors.textTertiary} style={{ marginBottom: 12 }} />
            <Typography color={colors.textSecondary}>Search for a song or artist</Typography>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.trackId.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.trackRow} onPress={() => handleSelect(item)}>
                <Image source={{ uri: item.artworkUrl100 }} style={styles.artwork} />
                <View style={styles.trackInfo}>
                  <Typography variant="medium" color={colors.textPrimary} numberOfLines={1}>
                    {item.trackName}
                  </Typography>
                  <Typography variant="regular" size="small" color={colors.textSecondary} numberOfLines={1}>
                    {item.artistName}
                  </Typography>
                </View>
                {item.previewUrl && (
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => Linking.openURL(item.previewUrl!)}
                  >
                    <Feather name="play-circle" size={24} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.m,
    paddingVertical: layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: 8,
    width: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    margin: layout.spacing.m,
    paddingHorizontal: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: layout.spacing.xl,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: layout.spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.surfaceHighlight,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewBtn: {
    padding: 8,
  }
});
