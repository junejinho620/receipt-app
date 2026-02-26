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

export default api;
