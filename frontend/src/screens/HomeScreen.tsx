import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { MusicSearchModal, iTunesTrack } from '../components/MusicSearchModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { Feather } from '@expo/vector-icons';
import { MenuModal } from '../components/MenuModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

type activeTabType = 'Journal' | 'Evidence' | 'Prompts';
type MediaType = 'Photo' | 'Music';
type InputType = 'Text' | 'Emoji';

const SUGGESTED_PROMPTS = [
  "What made you smile today?",
  "A small win you're proud of",
  "Something you're grateful for",
  "What challenged you today?",
  "A moment worth remembering",
];

const EMOJI_OPTIONS = [
  '😊', '😂', '❤️', '🎉', '🔥', '👍', '💯', '✨',
  '😢', '😭', '💔', '😞', '💧', '👎', '❌', '🌧️'
];

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<activeTabType>('Journal');
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaType>('Photo');
  const [selectedInput, setSelectedInput] = useState<InputType>('Text');
  const [textContent, setTextContent] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);

  const [logTitle, setLogTitle] = useState('');
  const [location, setLocation] = useState('');

  const [existingLog, setExistingLog] = useState<any>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Media state
  const [selectedPhotos, setSelectedPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<iTunesTrack | null>(null);
  const [isMusicModalVisible, setIsMusicModalVisible] = useState(false);

  const characterCount = textContent.length;
  const hasContent = selectedInput === 'Text'
    ? textContent.trim().length > 0
    : selectedEmojis.length > 0;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const isoDateString = today.toISOString().split('T')[0];

  React.useEffect(() => {
    if (!user) return;
    const fetchTodayLog = async () => {
      try {
        const response = await api.get(`/api/logs/${user.id}/${isoDateString}`);
        if (response.data.data) {
          const log = response.data.data;
          setExistingLog(log);
          setLogTitle(log.title || '');
          setLocation(log.location || '');
          if (log.inputType === 'Emoji') {
            setSelectedInput('Emoji');
            setSelectedEmojis(log.content ? log.content.split(',') : []);
          } else {
            setSelectedInput('Text');
            setTextContent(log.content || '');
          }
        }
      } catch (err) {
        // No log found for today - that's fine
        console.log('No log for today yet');
      } finally {
        setIsLoadingLog(false);
      }
    };
    fetchTodayLog();
  }, [user, isoDateString]);

  const handlePickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSelectedPhotos((prev) => {
        const combined = [...prev, ...result.assets];
        return combined.slice(0, 5); // hard cap at 5
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickMusic = () => {
    setIsMusicModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('date', isoDateString);
      formData.append('text', selectedInput === 'Text' ? textContent : '');
      formData.append('emoji', selectedEmojis.join(','));
      if (logTitle) formData.append('tags', JSON.stringify([logTitle]));
      if (location) formData.append('location', JSON.stringify({ name: location }));

      // Append photos
      selectedPhotos.forEach((photo, index) => {
        const ext = photo.uri.split('.').pop() || 'jpg';
        formData.append('media', {
          uri: photo.uri,
          name: `photo_${index}.${ext}`,
          type: photo.mimeType || `image/${ext}`,
        } as any);
      });

      // Append audio as externalMedia JSON
      if (selectedTrack) {
        const externalMedia = {
          type: 'music',
          url: selectedTrack.previewUrl || '',
          thumbnail: selectedTrack.artworkUrl100,
          metadata: {
            title: selectedTrack.trackName,
            artist: selectedTrack.artistName,
            album: selectedTrack.collectionName || ''
          }
        };
        formData.append('externalMedia', JSON.stringify(externalMedia));
      }

      const response = await api.post('/api/entries', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExistingLog(response.data.data);
      Alert.alert('Success!', 'Your entry for today has been locked.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to settle book. You might have already submitted today.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmojiPress = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter(e => e !== emoji));
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Minimal & Clean */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
              <Feather name="menu" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ letterSpacing: 1 }}>
              DAILY LOG
            </Typography>
          </View>
          <Typography variant="bold" size="h1" color={colors.textPrimary} style={styles.dateText}>
            {formattedDate}
          </Typography>
          <View style={styles.streakBadge}>
            <Typography variant="mono" size="caption" color={colors.surface}>212 DAY STREAK</Typography>
          </View>
        </Animated.View>

        {/* Tab Navigation */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.tabContainer}>
          {(['Journal', 'Evidence', 'Prompts'] as activeTabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Typography
                variant={activeTab === tab ? "bold" : "medium"}
                size="small"
                color={activeTab === tab ? colors.textPrimary : colors.textSecondary}
              >
                {tab}
              </Typography>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Timeline Connector */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />

          {/* Main Entry Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.contentContainer}>

            {/* Dynamic Content Area based on Tab */}
            {activeTab === 'Journal' && (
              <Animated.View entering={FadeInDown.duration(200)}>
                {/* Input Mode Selector - Floating Pills */}
                <View style={styles.modeSelector}>
                  {(['Text', 'Emoji'] as InputType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedInput(type)}
                      disabled={!!existingLog}
                      style={[
                        styles.modeChip,
                        selectedInput === type && styles.modeChipActive
                      ]}
                    >
                      <Typography
                        variant={selectedInput === type ? "bold" : "regular"}
                        size="small"
                        color={selectedInput === type ? colors.surface : colors.textSecondary}
                      >
                        {type}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input Area */}
                <Card variant="elevated" style={styles.inputCard}>
                  {/* Common Header: Title & Location */}
                  <View style={styles.inputHeader}>
                    <TextInput
                      style={styles.titleInput}
                      placeholder="Title"
                      placeholderTextColor={colors.textTertiary}
                      value={logTitle}
                      onChangeText={setLogTitle}
                      editable={!existingLog}
                    />
                    <View style={styles.locationContainer}>
                      <Feather name="map-pin" size={14} color={colors.textTertiary} />
                      <TextInput
                        style={styles.locationInput}
                        placeholder="Add location"
                        placeholderTextColor={colors.textTertiary}
                        value={location}
                        onChangeText={setLocation}
                        editable={!existingLog}
                      />
                    </View>
                  </View>
                  <View style={styles.divider} />

                  {selectedInput === 'Text' ? (
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Capture your day..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        value={textContent}
                        onChangeText={setTextContent}
                        editable={!existingLog}
                      />
                      <View style={styles.inputFooter}>
                        <Typography variant="mono" size="caption" color={colors.textTertiary}>
                          {0 + characterCount} / 500
                        </Typography>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emojiGrid}>
                      {EMOJI_OPTIONS.map((emoji, index) => (
                        <TouchableOpacity
                          key={index}
                          disabled={!!existingLog}
                          style={[
                            styles.emojiButton,
                            selectedEmojis.includes(emoji) && styles.emojiButtonSelected,
                          ]}
                          onPress={() => handleEmojiPress(emoji)}
                        >
                          <Typography size="h2">{emoji}</Typography>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>
              </Animated.View>
            )}

            {activeTab === 'Evidence' && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.addonsContainer}>
                <View style={styles.modeSelector}>
                  {(['Photo', 'Music'] as MediaType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedMedia(type)}
                      disabled={!!existingLog}
                      style={[
                        styles.modeChip,
                        selectedMedia === type && styles.modeChipActive
                      ]}
                    >
                      <Typography
                        variant={selectedMedia === type ? "bold" : "regular"}
                        size="small"
                        color={selectedMedia === type ? colors.surface : colors.textSecondary}
                      >
                        {type}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedMedia === 'Photo' ? (
                  <View>
                    {/* Existing log photos */}
                    {existingLog?.media?.filter((m: any) => m.type === 'image').length > 0 && (
                      <View style={styles.photoGrid}>
                        {existingLog.media.filter((m: any) => m.type === 'image').map((m: any, i: number) => (
                          <Image key={i} source={{ uri: m.url.startsWith('http') ? m.url : `${api.defaults.baseURL}${m.url}` }} style={styles.photoThumb} />
                        ))}
                      </View>
                    )}

                    {/* Selected photos preview */}
                    {selectedPhotos.length > 0 && !existingLog && (
                      <View style={styles.photoGrid}>
                        {selectedPhotos.map((photo, index) => (
                          <View key={index} style={styles.photoThumbWrapper}>
                            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                            <TouchableOpacity style={styles.photoRemoveButton} onPress={() => handleRemovePhoto(index)}>
                              <Feather name="x" size={14} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Pick photos button */}
                    {!existingLog && selectedPhotos.length < 5 && (
                      <TouchableOpacity style={styles.mediaPlaceholder} onPress={handlePickPhotos}>
                        <Feather name="camera" size={28} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                        <Typography variant="medium" color={colors.textSecondary}>
                          {selectedPhotos.length > 0 ? `Add More (${selectedPhotos.length}/5)` : 'Tap to Select Photos'}
                        </Typography>
                        <Typography variant="regular" size="small" color={colors.textTertiary} style={{ marginTop: 4 }}>
                          Select up to 5 images
                        </Typography>
                      </TouchableOpacity>
                    )}

                    {existingLog && !existingLog?.media?.some((m: any) => m.type === 'image') && (
                      <View style={styles.mediaPlaceholder}>
                        <Feather name="image" size={28} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                        <Typography variant="medium" color={colors.textTertiary}>No photos attached</Typography>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    {/* Existing log audio */}
                    {existingLog?.media?.filter((m: any) => m.type === 'music').length > 0 && (
                      <View style={styles.audioCard}>
                        {existingLog.media.filter((m: any) => m.type === 'music').map((m: any, i: number) => (
                          <View key={i} style={styles.audioRow}>
                            {m.thumbnail ? (
                              <Image source={{ uri: m.thumbnail }} style={styles.trackArtwork} />
                            ) : (
                              <View style={[styles.trackArtwork, { alignItems: 'center', justifyContent: 'center' }]}>
                                <Feather name="music" size={20} color={colors.primary} />
                              </View>
                            )}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Typography variant="medium" color={colors.textPrimary}>
                                {m.metadata?.title || m.url?.split('/').pop() || 'Audio track'}
                              </Typography>
                              {m.metadata?.artist && (
                                <Typography variant="regular" size="small" color={colors.textSecondary}>
                                  {m.metadata.artist}
                                </Typography>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Selected audio */}
                    {selectedTrack && !existingLog && (
                      <View style={styles.audioCard}>
                        <View style={styles.audioRow}>
                          {selectedTrack.artworkUrl100 ? (
                            <Image source={{ uri: selectedTrack.artworkUrl100 }} style={styles.trackArtwork} />
                          ) : (
                            <View style={[styles.trackArtwork, { alignItems: 'center', justifyContent: 'center' }]}>
                              <Feather name="music" size={20} color={colors.primary} />
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                            <Typography variant="medium" color={colors.textPrimary} numberOfLines={1}>
                              {selectedTrack.trackName}
                            </Typography>
                            <Typography variant="regular" size="small" color={colors.textSecondary} numberOfLines={1}>
                              {selectedTrack.artistName}
                            </Typography>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedTrack(null)}>
                            <Feather name="x-circle" size={20} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Pick music button */}
                    {!existingLog && !selectedTrack && (
                      <TouchableOpacity style={styles.mediaPlaceholder} onPress={handlePickMusic}>
                        <Feather name="search" size={28} color={colors.textSecondary} style={{ marginBottom: 8 }} />
                        <Typography variant="medium" color={colors.textSecondary}>Search Music</Typography>
                        <Typography variant="regular" size="small" color={colors.textTertiary} style={{ marginTop: 4 }}>
                          Find a song to add to your log
                        </Typography>
                      </TouchableOpacity>
                    )}

                    {existingLog && !existingLog?.media?.some((m: any) => m.type === 'music') && (
                      <View style={styles.mediaPlaceholder}>
                        <Feather name="headphones" size={28} color={colors.textTertiary} style={{ marginBottom: 8 }} />
                        <Typography variant="medium" color={colors.textTertiary}>No audio attached</Typography>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            )}

            {activeTab === 'Prompts' && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.promptsContainer}>
                <Typography variant="regular" size="body" color={colors.textSecondary} style={{ marginBottom: 16 }}>
                  Need a spark? Select a prompt to reflect on.
                </Typography>
                <View style={styles.promptsGrid}>
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.promptListCard,
                        selectedPromptIndex === index && styles.promptListCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedPromptIndex(selectedPromptIndex === index ? null : index);
                      }}
                    >
                      <Typography
                        variant={selectedPromptIndex === index ? "bold" : "medium"}
                        size="small"
                        color={selectedPromptIndex === index ? colors.surface : colors.textPrimary}
                      >
                        {prompt}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

          </Animated.View>
        </View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
          <Button
            title={existingLog ? "Entry Locked" : "Settle the Books"}
            onPress={handleSubmit}
            disabled={!hasContent || !!existingLog || isSaving || isLoadingLog}
            loading={isSaving}
            variant="primary"
            style={styles.submitButton}
          />
          <Typography variant="mono" size="caption" color={colors.textTertiary} centered style={{ marginTop: 12 }}>
            RECEIPT #{(Math.random() * 10000).toFixed(0).padStart(5, '0')}
          </Typography>
        </Animated.View>

      </ScrollView>

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => {
          setMenuVisible(false);
          logout();
        }}
        onNavigateToProfile={() => navigation.navigate('Profile')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
        onNavigateToWeeklyReport={() => navigation.navigate('WeeklyReport')}
        onNavigateToNotifications={() => navigation.navigate('Notifications')}
        onNavigateToAccount={() => navigation.navigate('Account')}
        onNavigateToDataPrivacy={() => navigation.navigate('DataPrivacy')}
        onNavigateToAboutHelp={() => navigation.navigate('AboutHelp')}
      />

      <MusicSearchModal
        visible={isMusicModalVisible}
        onClose={() => setIsMusicModalVisible(false)}
        onSelectTrack={(track) => setSelectedTrack(track)}
      />
    </ScreenWrapper >
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.l,
    paddingTop: 80,
    paddingBottom: 80,
  },
  header: {
    marginBottom: layout.spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.s,
    marginLeft: -layout.spacing.s,
  },
  menuButton: {
    padding: layout.spacing.s,
    marginRight: 4,
  },
  dateText: {
    marginVertical: 4,
  },
  streakBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timelineContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  timelineLine: {
    width: 2,
    backgroundColor: colors.border,
    marginRight: layout.spacing.l,
    borderRadius: 1,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: layout.spacing.m,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inputCard: {
    marginBottom: layout.spacing.xl,
    minHeight: 180,
  },
  inputHeader: {
    paddingBottom: layout.spacing.m,
  },
  titleInput: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationInput: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: layout.spacing.m,
  },
  textInput: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  emojiButtonSelected: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addonsContainer: {
    flex: 1,
  },
  mediaPlaceholder: {
    flex: 1,
    minHeight: 250,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: layout.borderRadius.m,
    borderStyle: 'dashed',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: layout.spacing.m,
  },
  photoThumbWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: layout.borderRadius.m,
    backgroundColor: colors.surface,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error || '#D9534F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: layout.spacing.m,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackArtwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.surfaceHighlight,
  },
  promptsContainer: {
    flex: 1,
  },
  promptsGrid: {
    gap: 12,
  },
  promptListCard: {
    padding: 16,
    borderRadius: layout.borderRadius.m,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptListCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: layout.spacing.l,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  tabButton: {
    paddingBottom: 8,
    marginBottom: -9, // Overlap border
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  footer: {
    marginTop: layout.spacing.xl,
    paddingTop: layout.spacing.m,
  },
  submitButton: {
    width: '100%',
    height: 56,
  },
});

