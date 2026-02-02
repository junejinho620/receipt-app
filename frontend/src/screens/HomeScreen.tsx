import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../styles';

type MediaType = 'Photo' | 'Music';
type InputType = 'Text' | 'Emoji';

const SUGGESTED_PROMPTS = [
  "What made you smile today?",
  "A small win you're proud of",
  "Something you're grateful for",
  "What challenged you today?",
  "A moment worth remembering",
  "What did you learn today?",
  "Who made a difference today?",
  "Your biggest accomplishment",
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
  const [showCustomEmojiInput, setShowCustomEmojiInput] = useState(false);
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  const characterCount = textContent.length;
  const emojiCount = selectedEmojis.length;
  const hasContent = selectedInput === 'Text'
    ? textContent.trim().length > 0
    : selectedEmojis.length > 0;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const streakCount = 212;

  const handlePromptPress = (index: number) => {
    setSelectedPromptIndex(selectedPromptIndex === index ? null : index);
  };

  const handleEmojiPress = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter(e => e !== emoji));
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const removeEmoji = (emoji: string) => {
    setSelectedEmojis(selectedEmojis.filter(e => e !== emoji));
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmojiInput.trim()) {
      // Extract emojis from the input
      const emojiRegex = /[\p{Emoji}\u200d]+/gu;
      const emojis = customEmojiInput.match(emojiRegex) || [];

      emojis.forEach(emoji => {
        if (!selectedEmojis.includes(emoji)) {
          setSelectedEmojis(prev => [...prev, emoji]);
        }
      });

      setCustomEmojiInput('');
      setShowCustomEmojiInput(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <BlurView intensity={40} tint="light" style={styles.streakBadge}>
              <Text style={styles.streakCount}>{streakCount}</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
            </BlurView>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        {/* Media Type Tabs */}
        <View style={styles.tabContainer}>
          {(['Photo', 'Music'] as MediaType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tab,
                selectedMedia === type && styles.tabActive,
              ]}
              onPress={() => setSelectedMedia(type)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedMedia === type && styles.tabTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upload Area */}
        <TouchableOpacity style={styles.uploadArea}>
          <View style={styles.uploadIcon}>
            <Text style={styles.uploadArrow}>↑</Text>
          </View>
          <Text style={styles.uploadText}>Drop your {selectedMedia.toLowerCase()} here</Text>
          <Text style={styles.uploadSubtext}>or click to browse</Text>
        </TouchableOpacity>

        {/* Input Type Tabs */}
        <View style={styles.inputTabContainer}>
          {(['Text', 'Emoji'] as InputType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.inputTab,
                selectedInput === type && styles.inputTabActive,
              ]}
              onPress={() => setSelectedInput(type)}
            >
              <Text
                style={[
                  styles.inputTabText,
                  selectedInput === type && styles.inputTabTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Input Area */}
        {selectedInput === 'Text' ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind today?"
              placeholderTextColor={colors.textPlaceholder}
              multiline
              value={textContent}
              onChangeText={setTextContent}
            />
            <View style={styles.characterCountContainer}>
              <Text style={styles.characterCount}>{characterCount} characters</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emojiContainer}>
            {/* Selected Emojis Display */}
            <View style={styles.selectedEmojisRow}>
              <Text style={styles.selectedLabel}>Selected:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedScrollView}
              >
                {selectedEmojis.length > 0 ? (
                  selectedEmojis.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => removeEmoji(emoji)}
                      style={styles.selectedEmojiItem}
                    >
                      <Text style={styles.selectedEmojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptySelectedText}>Tap emojis below to select</Text>
                )}
              </ScrollView>
              <Text style={styles.emojiCount}>
                {emojiCount}
              </Text>
            </View>

            {/* Emoji Grid - Single Row */}
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
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Custom Emoji */}
            {!showCustomEmojiInput ? (
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => setShowCustomEmojiInput(true)}
              >
                <Text style={styles.addMoreText}>+ Add more emojis</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customEmojiInputContainer}>
                <TextInput
                  style={styles.customEmojiInput}
                  placeholder="Browse emojis..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={customEmojiInput}
                  onChangeText={setCustomEmojiInput}
                  autoFocus
                  onSubmitEditing={handleCustomEmojiSubmit}
                />
                <TouchableOpacity
                  style={styles.addEmojiButton}
                  onPress={handleCustomEmojiSubmit}
                >
                  <Text style={styles.addEmojiButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Suggested Prompts */}
        <View style={styles.promptsSection}>
          <Text style={styles.promptsLabel}>Need inspiration?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptsScroll}
            contentContainerStyle={styles.promptsContent}
          >
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.promptChip,
                  selectedPromptIndex === index && styles.promptChipSelected,
                ]}
                onPress={() => handlePromptPress(index)}
              >
                <Text style={[
                  styles.promptText,
                  selectedPromptIndex === index && styles.promptTextSelected,
                ]}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !hasContent && styles.saveButtonDisabled
            ]}
            disabled={!hasContent}
          >
            <Text style={[
              styles.saveButtonText,
              !hasContent && styles.saveButtonTextDisabled
            ]}>
              Save Today's Receipt
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 14,
    gap: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.36,
    shadowRadius: 8,
    elevation: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuButton: {
    padding: 8,
    gap: 5,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.buttonText,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.borderDashed,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  uploadText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
  inputTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inputTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inputTabText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  inputTabTextActive: {
    color: colors.buttonText,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 32,
    minHeight: 180,
    position: 'relative',
  },
  textInput: {
    padding: 16,
    paddingBottom: 40,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 180,
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textLight,
  },
  emojiContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 32,
    padding: 12,
  },
  selectedEmojisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedScrollView: {
    flex: 1,
  },
  selectedEmojiItem: {
    marginRight: 6,
  },
  selectedEmojiText: {
    fontSize: 24,
  },
  emptySelectedText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emojiCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'right',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 8,
  },
  emojiButton: {
    width: '10.5%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  addMoreButton: {
    padding: 10,
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  customEmojiInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customEmojiInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.text,
  },
  addEmojiButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmojiButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
  promptsSection: {
    marginBottom: 24,
  },
  promptsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  promptsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  promptsContent: {
    gap: 10,
  },
  promptChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  promptText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  promptTextSelected: {
    color: colors.buttonText,
  },
  buttonContainer: {
    paddingBottom: 48,
  },
  saveButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
  saveButtonTextDisabled: {
    color: colors.textLight,
  },
});
