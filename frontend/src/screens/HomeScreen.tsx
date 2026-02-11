import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';

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

export function HomeScreen() {
  const [selectedMedia, setSelectedMedia] = useState<MediaType>('Photo');
  const [selectedInput, setSelectedInput] = useState<InputType>('Text');
  const [textContent, setTextContent] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);

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
          <Typography variant="regular" size="small" color={colors.textSecondary} style={{ letterSpacing: 1 }}>
            DAILY LOG
          </Typography>
          <Typography variant="bold" size="h1" color={colors.textPrimary} style={styles.dateText}>
            {formattedDate}
          </Typography>
          <View style={styles.streakBadge}>
            <Typography variant="mono" size="caption" color={colors.surface}>212 DAY STREAK</Typography>
          </View>
        </Animated.View>

        {/* Timeline Connector */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />

          {/* Main Entry Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.contentContainer}>

            {/* Input Mode Selector - Floating Pills */}
            <View style={styles.modeSelector}>
              {(['Text', 'Emoji'] as InputType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedInput(type)}
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
              {selectedInput === 'Text' ? (
                <View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Capture your day..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    value={textContent}
                    onChangeText={setTextContent}
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

            {/* Media & Prompts Section */}
            <View style={styles.addonsContainer}>
              <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionTitle}>
                ADD EVIDENCE
              </Typography>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                {(['Photo', 'Music'] as MediaType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mediaButton,
                      selectedMedia === type && styles.mediaButtonActive
                    ]}
                    onPress={() => setSelectedMedia(type)}
                  >
                    <Image
                      source={type === 'Photo' ? require('../../assets/camera-3d-green.png') : require('../../assets/music-note-3d-green.png')}
                      style={{ width: 24, height: 24, marginRight: 8 }}
                      resizeMode="contain"
                    />
                    <Typography
                      variant="medium"
                      size="small"
                      color={selectedMedia === type ? colors.primary : colors.textSecondary}
                    >
                      {type}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Prompts */}
            <View style={styles.promptsContainer}>
              <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionTitle}>
                REFLECTION PROMPTS
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.promptChip,
                      selectedPromptIndex === index && styles.promptChipSelected,
                    ]}
                    onPress={() => setSelectedPromptIndex(selectedPromptIndex === index ? null : index)}
                  >
                    <Typography
                      variant="medium"
                      size="caption"
                      color={selectedPromptIndex === index ? colors.surface : colors.textSecondary}
                    >
                      {prompt}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </Animated.View>
        </View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
          <Button
            title="Settle the Books"
            onPress={() => { }}
            disabled={!hasContent}
            variant="primary"
            style={styles.submitButton}
          />
          <Typography variant="mono" size="caption" color={colors.textTertiary} centered style={{ marginTop: 12 }}>
            RECEIPT #{(Math.random() * 10000).toFixed(0).padStart(5, '0')}
          </Typography>
        </Animated.View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xxl,
  },
  header: {
    marginBottom: layout.spacing.xl,
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
    marginBottom: layout.spacing.xl,
  },
  timelineLine: {
    width: 2,
    backgroundColor: colors.border,
    marginRight: layout.spacing.l,
    borderRadius: 1,
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
    borderStyle: 'dashed',
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
    marginBottom: layout.spacing.xl,
  },
  sectionTitle: {
    marginBottom: layout.spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaScroll: {

  },
  mediaButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlight,
  },
  promptsContainer: {

  },
  promptsScroll: {
    marginLeft: -layout.spacing.l,
    paddingHorizontal: layout.spacing.l,
  },
  promptChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  promptChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  footer: {
    marginTop: layout.spacing.l,
  },
  submitButton: {
    width: '100%',
    height: 56,
  },
});
