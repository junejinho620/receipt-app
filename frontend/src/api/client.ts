import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LOCALHOST = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

const api = axios.create({
  baseURL: LOCALHOST,
  timeout: 15000, // Increased from 10s to 15s for slower connections
});

// ---- Request Interceptor: Attach JWT ----
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor: Handle 401 Token Expiry ----
// We use a lazy import of the auth module to avoid circular dependency issues.
// When the server returns 401 (token expired/invalid), we clear local auth state
// so the user is redirected to the login screen gracefully.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Token is expired or invalid — clear stored credentials
      try {
        await AsyncStorage.multiRemove(['userToken', 'userData', 'viewedFriendFeeds']);
      } catch (e) {
        console.warn('Failed to clear auth storage on 401:', e);
      }
      // The AuthContext will pick up the missing token on next render/focus
      // and redirect to Auth screen automatically.
    }
    return Promise.reject(error);
  }
);

// ---- Upload Helper ----
export const uploadFile = async (localUri: string): Promise<string> => {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  let type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
  if (type === 'image/jpg') type = 'image/jpeg';

  formData.append('file', {
    uri: localUri,
    name: filename,
    type,
  } as any);

  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url;
};

export default api;
