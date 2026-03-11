import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set global behavior for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CREATIVE_COPY = [
  {
    title: "A Gentle Reminder 📝",
    body: "Your daily note is ready. Take a moment to reflect on your day."
  },
  {
    title: "Daily Reflection 🔍",
    body: "What made you smile today? Add it to your archive."
  },
  {
    title: "Streak Saver ⏳",
    body: "Keep your momentum going! Jot down today's note before midnight."
  },
  {
    title: "Your Day in Review 🌅",
    body: "Every day matters. What was the highlight of yours?"
  },
  {
    title: "Time to Unwind 🌙",
    body: "Time to wrap up. How did today go?"
  },
  {
    title: "A Moment of Peace 📦",
    body: "Take a deep breath and look back. What's one thing you're grateful for?"
  },
  {
    title: "A Penny for Your Thoughts 🪙",
    body: "What's on your mind? Note it down before you forget."
  }
];

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

export async function scheduleDailyReminders(hour: number, minute: number) {
  // First clear any existing reminders so we don't build up a massive queue
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule a rolling window of 7 days with varying copy
  for (let i = 0; i < 7; i++) {
    const copy = CREATIVE_COPY[i % CREATIVE_COPY.length];

    // We create a trigger relative to today + i days
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + i);
    triggerDate.setHours(hour);
    triggerDate.setMinutes(minute);
    triggerDate.setSeconds(0);
    triggerDate.setMilliseconds(0);

    // If the scheduled time for *today* has already passed, 
    // we must bump the schedule forward by 1 day so it fires tomorrow instead.
    if (triggerDate <= new Date()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        sound: true,
      },
      trigger: {
        type: 'calendar',
        // Next major release to expo-notifications deprecated `day` for exact date, use absolute date components:
        year: triggerDate.getFullYear(),
        month: triggerDate.getMonth() + 1,
        day: triggerDate.getDate(),
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes(),
      } as Notifications.CalendarTriggerInput,
    });
  }

  console.log(`Successfully scheduled 7 days of reminders starting at ${hour}:${minute.toString().padStart(2, '0')}`);
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('Cancelled all scheduled notifications');
}
