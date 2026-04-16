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
import KeyboardAwareContainer from '../../assets/components/KeyboardAwareContainer';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyEmail, quickEmailValidation } from '../../utils/emailVerification';
import { API_URL } from '../../constants/api';
import { validateOrcid } from '../../utils/orcid';

const Signup = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State variables
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userType, setUserType] = useState('community'); // Default: community
  const [educationData, setEducationData] = useState(null);
  const [orcid, setOrcid] = useState('');
  const [orcidError, setOrcidError] = useState('');
  const [orcidValid, setOrcidValid] = useState(false);
  
  // Email verification states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationResult, setEmailVerificationResult] = useState(null);
  const [quickEmailError, setQuickEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check for selected user type from SignInAs screen
  useEffect(() => {
    const checkUserType = async () => {
      try {
        const selectedUserType = await AsyncStorage.getItem('selectedUserType');
        console.log('Selected user type from storage:', selectedUserType);
        
        if (selectedUserType === 'researcher') {
          // Check for researcher education data
          const storedEducationData = await AsyncStorage.getItem('researcherEducationData');
          if (storedEducationData) {
            setUserType('researcher');
            setEducationData(JSON.parse(storedEducationData));
          } else {
            // If no education data, go back to education screen
            Alert.alert('Error', 'Education data not found. Please start over.');
            router.replace('/(tabs)/SignInAs');
          }
        } else {
          // Default to community
          setUserType('community');
          // Clear any researcher flags
          await AsyncStorage.removeItem('userType');
        }
      } catch (error) {
        console.error('Error checking user type:', error);
        setUserType('community');
      }
    };
    
    checkUserType();
  }, []);

  // Prevent back navigation on this screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Password validation function
  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (pwd.length > 50) {
      return 'Password must not exceed 50 characters';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    return '';
  };

  // Username validation
  const validateUsername = (uname) => {
    if (!uname.trim()) {
      return 'Username is required';
    }
    if (uname.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (uname.trim().length > 20) {
      return 'Username must not exceed 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(uname.trim())) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  // Basic email validation
  const validateEmail = (eml) => {
    if (!eml.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eml)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

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

  // Handle email change with instant validation
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

  // Auto-verify email
  const handleAutoVerifyEmail = async () => {
    const basicValidation = validateEmail(email);
    if (basicValidation) {
      return;
    }

    const quickCheck = quickEmailValidation(email);
    if (!quickCheck.isValid) {
      return;
    }

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
      console.error('Email verification error:', error);
      setEmailError('Unable to verify email. Please check your connection.');
      setEmailVerified(false);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSignup = async () => {
    // Clear previous errors
    setPasswordError('');
    setUsernameError('');
    setEmailError('');

    // Validate all fields
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (usernameValidation) {
      setUsernameError(usernameValidation);
      Alert.alert('Validation Error', usernameValidation);
      return;
    }

    // ORCID validation for researchers only
    if (userType === 'researcher') {
      const orcidCheck = validateOrcid(orcid);
      if (!orcidCheck.isValid) {
        setOrcidError('Please enter a valid ORCID identifier');
        Alert.alert('Validation Error', 'Please enter a valid ORCID identifier');
        return;
      }
    }

    if (emailValidation) {
      setEmailError(emailValidation);
      Alert.alert('Validation Error', emailValidation);
      return;
    }

    // Check if email is verified
    if (!emailVerified) {
      Alert.alert(
        'Email Not Verified',
        'Please wait while we verify your email address, or check that you entered a valid email.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (passwordValidation) {
      setPasswordError(passwordValidation);
      Alert.alert('Validation Error', passwordValidation);
      return;
    }

    setLoading(true);
    try {
      const endpoint = userType === 'researcher' 
        ? `${API_URL}/api/auth/researcher/signup`
        : `${API_URL}/api/auth/signup`;

      console.log('Attempting to signup with:', { 
        username: username.trim(), 
        email: email.trim().toLowerCase(),
        userType: userType,
        emailVerified: emailVerified,
        apiUrl: endpoint
      });

      const requestBody = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

      if (userType === 'researcher') {
        if (!educationData) {
          Alert.alert('Error', 'Education data is missing. Please go back and fill in your education details.');
          setLoading(false);
          return;
        }
        requestBody.education = educationData;
        requestBody.orcid = orcid.trim();
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let result;
      const contentType = response.headers.get('content-type') || '';
      
      try {
        const text = await response.text();
        if (contentType.includes('application/json') || text.trim().startsWith('{')) {
          result = JSON.parse(text);
        } else {
          const errorMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/Error[:\s]+(.*?)(?:\n|<)/i);
          const errorMsg = errorMatch ? errorMatch[1] : 'Server returned an error page instead of JSON';
          throw new Error(`Server error: ${errorMsg}. Status: ${response.status}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse server response. Status: ${response.status}`);
      }

      if (response.ok) {
        // Clear stored selection data
        await AsyncStorage.removeItem('selectedUserType');
        
        if (userType === 'researcher') {
          await AsyncStorage.removeItem('researcherEducationData');
          await AsyncStorage.setItem('userType', 'researcher');
          await AsyncStorage.setItem('pendingVerification', 'true');

          Alert.alert('Registered – Pending Approval', 'Your researcher account has been created and is awaiting admin approval. You will be able to log in once verified.', [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/VerificationStatus'),
            },
          ]);
        } else {
          // Community user
          Alert.alert('Success', 'Account created successfully! Please log in.', [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/Login'),
            },
          ]);
        }
      } else {
        const errorMessage = result.message || result.error || 'Failed to create account. Please try again.';
        
        if (errorMessage.toLowerCase().includes('username')) {
          setUsernameError(errorMessage);
        } else if (errorMessage.toLowerCase().includes('email')) {
          setEmailError(errorMessage);
        } else {
          setPasswordError(errorMessage);
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Signup error details:', error);
      
      let errorMessage = 'Could not connect to server. ';
      
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check:\n1. Backend server is running\n2. IP address is correct\n3. Both devices are on the same network\n4. Firewall is not blocking the connection';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. The server may be slow or unreachable.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get email input style based on verification status
  const getEmailInputStyle = () => {
    if (emailError || quickEmailError) {
      return [styles.input, styles.inputError];
    }
    if (emailVerified) {
      return [styles.input, styles.inputSuccess];
    }
    return styles.input;
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

        <Text style={styles.title}>
          {userType === 'researcher' ? 'Create Researcher Account' : 'Create your account'}
        </Text>

        <View style={styles.formContainer}>
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

          {/* Email Input with Auto-Verification */}
          <View style={styles.emailContainer}>
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
          </View>

          {quickEmailError && !emailError && !isVerifyingEmail ? (
            <Text style={styles.warningText}>
              <Ionicons name="alert-circle-outline" size={14} color="#ff9800" /> {quickEmailError}
            </Text>
          ) : null}
          {emailError && !isVerifyingEmail ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
          
          {emailVerified && !isVerifyingEmail && (
            <Text style={styles.successText}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" /> Email verified successfully
            </Text>
          )}

          {/* ORCID input - ONLY for researcher signups */}
          {userType === 'researcher' && (
            <>
              <TextInput
                style={[
                  styles.input,
                  orcidError && styles.inputError,
                  orcidValid && styles.inputSuccess,
                ]}
                placeholder="ORCID (e.g., 0000-0000-0000-0000)"
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
            </>
          )}

          {/* Password Input */}
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
              Password must be 8-50 characters with at least one special character
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.signInButtonText}>SIGN UP</Text>
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
    marginBottom: 20,
  },
  logo: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
  },
  emailContainer: {
    marginBottom: 5,
  },
  emailInputWrapper: {
    position: 'relative',
    marginBottom: 5,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 5,
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
  signInButton: {
    backgroundColor: '#F4D03F',
    width: '100%',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  signInButtonDisabled: {
    opacity: 0.6,
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
  },
  helperText: {
    color: '#999',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default Signup;
