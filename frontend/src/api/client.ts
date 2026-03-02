import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LOCALHOST = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

const api = axios.create({
  baseURL: LOCALHOST,
  timeout: 10000,
});

// Intercept requests to attach JWT token
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

export const uploadFile = async (localUri: string): Promise<string> => {
  const formData = new FormData();
  // React Native FormData expects this specific shape for files
  const filename = localUri.split('/').pop() || 'upload.jpg';
  // Infer type from extension, default to jpeg
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: localUri,
    name: filename,
    type,
  } as any);

  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
};

export default api;
