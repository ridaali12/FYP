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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { API_URL } from '../../constants/api'; 

const ForgetPassword = () => {
  const router = useRouter();
  const { token: tokenFromUrl, email: emailFromUrl } = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // If token and email come from URL, show reset form
    if (tokenFromUrl && emailFromUrl) {
      setShowManualEntry(true);
      setToken(tokenFromUrl);
      setEmail(decodeURIComponent(emailFromUrl));
    }
  }, [tokenFromUrl, emailFromUrl]);

  const handleRequestReset = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return Alert.alert('Error', 'Invalid email.');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          'Success', 
          'Check your email for reset instructions. Copy the token from the email and use "Enter Token Manually" below.',
          [{ text: 'OK' }]
        );
      } else Alert.alert('Error', data.message || 'Failed to send email.');
    } catch (err) {
      console.error('Forgot password error:', err);
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !token.trim()) {
      return Alert.alert('Error', 'Please enter both email and token.');
    }
    if (!password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill both password fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    if (password.length < 8) {
      return Alert.alert('Error', 'Password must be at least 8 characters.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return Alert.alert('Error', 'Password must contain at least one special character.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token.trim(), 
          email: email.trim().toLowerCase(), 
          newPassword: password 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', data.message || 'Password reset successfully.', [
          { text: 'OK', onPress: () => router.push('/(tabs)/Login') },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Reset failed.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      Alert.alert('Error', 'Could not connect to server.');
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

        {showManualEntry ? (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the token from your email and create a new password.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Your Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Reset Token (from email)"
              placeholderTextColor="#999"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              multiline
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.resetButtonText}>UPDATE PASSWORD</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setShowManualEntry(false);
                setToken('');
                setPassword('');
                setConfirmPassword('');
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Back to Request Reset</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send instructions to reset your password.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.resetButtonText}>SEND RESET LINK</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowManualEntry(true)}
              style={styles.manualLink}
            >
              <Text style={styles.manualLinkText}>Already have a token? Enter manually</Text>
            </TouchableOpacity>

            <View style={styles.navigationContainer}>
              <Text style={styles.navigationText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/Login')}>
                <Text style={styles.navigationLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  input: {
    width: '95%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
  },
  passwordContainer: {
    width: '95%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  eyeIcon: {
    padding: 5,
  },
  resetButton: {
    backgroundColor: '#F4D03F',
    width: '95%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  manualLink: {
    marginBottom: 20,
  },
  manualLinkText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  backLink: {
    marginTop: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  navigationText: {
    fontSize: 14,
    color: '#000',
  },
  navigationLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});

export default ForgetPassword;