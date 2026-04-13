import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyEmail, quickEmailValidation } from '../../utils/emailVerification';
import { API_URL } from '../../constants/api';
import { validateOrcid } from '../../utils/orcid';

const OrcidSignIn = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orcid, setOrcid] = useState('');
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [orcidError, setOrcidError] = useState('');
  const [orcidValid, setOrcidValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationResult, setEmailVerificationResult] = useState(null);
  const [quickEmailError, setQuickEmailError] = useState('');

  // Prevent back navigation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Auto-verify email after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email && email.length > 0) {
        const validation = quickEmailValidation(email);
        if (validation.isValid) {
          handleAutoVerifyEmail();
        } else {
          setQuickEmailError(validation.message);
          setEmailVerified(false);
          setEmailVerificationResult(null);
        }
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
    setQuickEmailError('');
    setEmailVerified(false);
    setEmailVerificationResult(null);
    setIsVerifyingEmail(false);
    if (text.length > 0) {
      const validation = quickEmailValidation(text);
      if (!validation.isValid) {
        setQuickEmailError(validation.message);
      }
    }
  };

  const handleAutoVerifyEmail = async () => {
    const basicValidation = validateEmail(email);
    if (basicValidation) return;
    const quickCheck = quickEmailValidation(email);
    if (!quickCheck.isValid) return;

    setIsVerifyingEmail(true);
    setEmailError('');
    setQuickEmailError('');
    try {
      const result = await verifyEmail(email);
      setEmailVerificationResult(result);
      if (result.success && result.isValid) {
        setEmailVerified(true);
        setEmailError('');
      } else {
        setEmailVerified(false);
        setEmailError(result.message);
      }
    } catch (error) {
      setEmailError('Unable to verify email. Please check your connection.');
      setEmailVerified(false);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const validateUsername = (uname) => {
    if (!uname.trim()) return 'Username is required';
    if (uname.trim().length < 3) return 'Username must be at least 3 characters';
    if (uname.trim().length > 20) return 'Username must not exceed 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(uname.trim())) return 'Username can only contain letters, numbers, and underscores';
    return '';
  };

  const validateEmail = (eml) => {
    if (!eml.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eml)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long';
    if (pwd.length > 50) return 'Password must not exceed 50 characters';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd))
      return 'Password must contain at least one special character';
    return '';
  };

  const getEmailInputStyle = () => {
    if (emailError || quickEmailError) return [styles.input, styles.inputError];
    if (emailVerified) return [styles.input, styles.inputSuccess];
    return styles.input;
  };

  const handleRegister = async () => {
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setOrcidError('');

    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      Alert.alert('Validation Error', usernameValidation);
      return;
    }

    const orcidCheck = validateOrcid(orcid);
    if (!orcidCheck.isValid) {
      setOrcidError('Please enter a valid ORCID identifier (e.g. 0000-0000-0000-0000)');
      Alert.alert('Validation Error', 'Please enter a valid ORCID identifier');
      return;
    }

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      Alert.alert('Validation Error', emailValidation);
      return;
    }

    if (!emailVerified) {
      Alert.alert(
        'Email Not Verified',
        'Please wait while we verify your email address, or check that you entered a valid email.',
        [{ text: 'OK' }]
      );
      return;
    }

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      Alert.alert('Validation Error', passwordValidation);
      return;
    }

    setLoading(true);
    try {
      const storedEducationData = await AsyncStorage.getItem('researcherEducationData');
      if (!storedEducationData) {
        Alert.alert('Error', 'Education data is missing. Please go back and fill in your education details.');
        setLoading(false);
        return;
      }

      const educationData = JSON.parse(storedEducationData);

      const requestBody = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        education: educationData,
        orcid: orcid.trim(),
      };

      const response = await fetch(`${API_URL}/api/auth/researcher/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      let result;
      const contentType = response.headers.get('content-type') || '';
      try {
        const text = await response.text();
        if (contentType.includes('application/json') || text.trim().startsWith('{')) {
          result = JSON.parse(text);
        } else {
          const errorMatch = text.match(/<title>(.*?)<\/title>/i);
          const errorMsg = errorMatch ? errorMatch[1] : 'Server returned an error';
          throw new Error(`Server error: ${errorMsg}. Status: ${response.status}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse server response. Status: ${response.status}`);
      }

      if (response.ok) {
        await AsyncStorage.removeItem('researcherEducationData');
        await AsyncStorage.setItem('userType', 'researcher');
        await AsyncStorage.setItem('pendingVerification', 'true');

        Alert.alert(
          'Registered – Pending Approval',
          'Your researcher account has been created and is awaiting admin approval. You will be able to log in once verified.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/Login'),
            },
          ]
        );
      } else {
        const errorMessage = result.message || result.error || 'Failed to create account. Please try again.';
        if (errorMessage.toLowerCase().includes('username')) {
          setUsernameError(errorMessage);
        } else if (errorMessage.toLowerCase().includes('email')) {
          setEmailError(errorMessage);
        } else if (errorMessage.toLowerCase().includes('orcid')) {
          setOrcidError(errorMessage);
        } else {
          setPasswordError(errorMessage);
        }
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Could not connect to server. ';
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check your internet connection.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      Alert.alert('Connection Error', errorMessage);
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

        <Text style={styles.title}>Sign in with ORCID</Text>
        <Text style={styles.subtitle}>Complete your researcher account</Text>

        <View style={styles.formContainer}>
          {/* Username */}
          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            placeholder="Enter Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameError('');
            }}
            autoCapitalize="none"
          />
          {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

          {/* ORCID */}
          <TextInput
            style={[
              styles.input,
              orcidError && styles.inputError,
              orcidValid && styles.inputSuccess,
            ]}
            placeholder="ORCID  (0000-0000-0000-0000)"
            placeholderTextColor="#999"
            value={orcid}
            onChangeText={(text) => {
              setOrcid(text);
              setOrcidError('');
              const chk = validateOrcid(text);
              setOrcidValid(chk.isValid);
              if (!chk.isValid && text.length > 0) {
                setOrcidError('Invalid ORCID format');
              }
            }}
            autoCapitalize="characters"
          />
          {orcidError ? <Text style={styles.errorText}>{orcidError}</Text> : null}

          {/* Email with auto-verify */}
          <View style={styles.emailInputWrapper}>
            <TextInput
              style={getEmailInputStyle()}
              placeholder="Enter Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailVerified && !isVerifyingEmail && (
              <View style={styles.verificationIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
            {(emailError || quickEmailError) && !isVerifyingEmail && (
              <View style={styles.verificationIcon}>
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </View>
            )}
          </View>
          {quickEmailError && !emailError && !isVerifyingEmail ? (
            <Text style={styles.warningText}>{quickEmailError}</Text>
          ) : null}
          {emailError && !isVerifyingEmail ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
          {emailVerified && !isVerifyingEmail && (
            <Text style={styles.successText}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" /> Email verified successfully
            </Text>
          )}

          {/* Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, passwordError && styles.inputError]}
              placeholder="Enter Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {!passwordError && password.length > 0 && (
            <Text style={styles.helperText}>
              Password must be 8–50 characters with at least one special character
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.registerButtonText}>REGISTER</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Login')}>
            <Text style={styles.loginLink}>Login</Text>
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
    marginTop: 60,
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24,
  },
  formContainer: {
    width: '95%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#000',
    marginBottom: 14,
  },
  emailInputWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 6,
  },
  passwordInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 14,
    color: '#000',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 14,
    padding: 5,
  },
  verificationIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  inputSuccess: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 5,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    fontWeight: '500',
  },
  helperText: {
    color: '#999',
    fontSize: 11,
    marginBottom: 10,
    marginLeft: 5,
  },
  registerButton: {
    backgroundColor: '#F4D03F',
    width: '95%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#000',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});

export default OrcidSignIn;
