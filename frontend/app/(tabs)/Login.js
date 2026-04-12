import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

const Login = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prevent back navigation - user must login to access app
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Always prevent back navigation on login screen
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('userId', result.user._id);
        await AsyncStorage.setItem('username', result.user.username);
        await AsyncStorage.setItem('userEmail', result.user.email);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userType', result.user.userType || 'community');

        // Navigate based on user type
        const redirectScreen = result.user.userType === 'researcher' 
          ? '/(tabs)/HomeScreenR' 
          : '/(tabs)/HomeScreen';

        Alert.alert('Success', 'Logged in successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace(redirectScreen),
          },
        ]);
      } else {
        const msg = result.message || 'Invalid username or password. Please try again.';
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Connection Error', 'Could not connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareContainer>
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Log in to your account</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        activeOpacity={0.9}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginButtonText}>LOG IN</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/ForgetPassword')} 
        style={styles.forgetPasswordContainer}
      >
        <Text style={styles.forgetPasswordLink}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Signup')}>
          <Text style={styles.signupLink}>Signup</Text>
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  logo: {
    width: 280,
    height: 280,
  },
  title: {
    fontSize: 16,
    color: '#000',
    marginBottom: 50,
  },
  formContainer: {
    width: '95%',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
  },
  passwordContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#F4D03F',
    width: '95%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  forgetPasswordContainer: {
    marginBottom: 20,
  },
  forgetPasswordLink: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#000',
  },
  signupLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
});

export default Login;