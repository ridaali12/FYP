import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

export default function DisplaySurvey() {
  const router = useRouter();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    loadSurvey();
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const loadSurvey = async () => {
    try {
      const surveyData = await AsyncStorage.getItem('currentSurvey');
      if (surveyData) {
        setSurvey(JSON.parse(surveyData));
      } else {
        Alert.alert('Error', 'No survey found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load survey');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const currentField = survey.fields[currentStep];
    if (currentField.required && (!responses[currentField.label] || responses[currentField.label].toString().trim() === '')) {
      Alert.alert('Required Field', 'Please complete this field to continue');
      return;
    }
    
    if (currentStep < survey.fields.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const requiredFields = survey.fields.filter(f => f.required);
    const missing = requiredFields.filter(f => !responses[f.label] || responses[f.label].toString().trim() === '');
    
    if (missing.length > 0) {
      Alert.alert('Incomplete Survey', `Please complete: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    const submissionData = {
      surveyId: survey.id,
      surveyTitle: survey.title,
      responses: responses,
      submittedAt: new Date().toISOString(),
    };

    try {
      const existingResponses = await AsyncStorage.getItem('surveyResponses');
      const responsesArray = existingResponses ? JSON.parse(existingResponses) : [];
      responsesArray.push(submissionData);
      await AsyncStorage.setItem('surveyResponses', JSON.stringify(responsesArray));
      
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit survey');
      console.error(error);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Discard Progress?',
      'Your current progress will be lost. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', onPress: () => router.back(), style: 'destructive' }
      ]
    );
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Your Response</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder || 'Type your answer here...'}
              placeholderTextColor="#94a3b8"
              value={responses[field.label] || ''}
              onChangeText={(text) => setResponses({...responses, [field.label]: text})}
              autoFocus
            />
          </View>
        );
      
      case 'number':
        return (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Your Response</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder || 'Enter a number...'}
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={responses[field.label] || ''}
              onChangeText={(text) => setResponses({...responses, [field.label]: text})}
              autoFocus
            />
          </View>
        );
      
      case 'textarea':
        return (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Your Response</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={field.placeholder || 'Type your detailed answer here...'}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={responses[field.label] || ''}
              onChangeText={(text) => setResponses({...responses, [field.label]: text})}
              autoFocus
            />
          </View>
        );
      
      case 'date':
        return (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Select Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={responses[field.label] || ''}
              onChangeText={(text) => setResponses({...responses, [field.label]: text})}
              autoFocus
            />
          </View>
        );
      
      case 'time':
        return (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Select Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#94a3b8"
              value={responses[field.label] || ''}
              onChangeText={(text) => setResponses({...responses, [field.label]: text})}
              autoFocus
            />
          </View>
        );
      
      case 'checkbox':
        return (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setResponses({...responses, [field.label]: !responses[field.label]})}
            activeOpacity={0.7}
          >
            {responses[field.label] ? (
              <LinearGradient
                colors={['#1b4332', '#2d6a4f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkboxChecked}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={styles.checkbox} />
            )}
            <Text style={styles.checkboxLabel}>
              {field.placeholder || 'I agree to the above statement'}
            </Text>
          </TouchableOpacity>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="hourglass-outline" size={52} color="#2d6a4f" />
          </View>
          <Text style={styles.loadingText}>Loading Survey</Text>
          <Text style={styles.loadingSubtext}>Please wait...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!survey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Ionicons name="document-text-outline" size={64} color="#2d6a4f" />
          <Text style={styles.errorText}>Survey Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <View style={styles.successIconWrapper}>
              <View style={styles.successIconBg}>
                <Ionicons name="checkmark-circle" size={72} color="#2d6a4f" />
              </View>
            </View>
            <Text style={styles.successTitle}>Successfully Submitted</Text>
            <Text style={styles.successMessage}>
              Thank you for completing this survey. Your response has been recorded and will be reviewed by our research team.
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity 
                style={styles.successButton}
                onPress={() => router.push('/(tabs)/ResearcherHub')}
                activeOpacity={0.8}
              >
                <Text style={styles.successButtonText}>Return to Dashboard</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalSteps = survey.fields.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentField = survey.fields[currentStep];
  const completedCount = Object.keys(responses).filter(key => responses[key]).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Survey Response</Text>
          <Text style={styles.headerSubtitle}>Wildlife Conservation</Text>
        </View>
        <TouchableOpacity 
          style={styles.plusButton} 
          onPress={() => router.push('/CreateSurvey')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#2d6a4f" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="document-text" size={20} color="#2d6a4f" />
            </View>
            <Text style={styles.statValue}>{totalSteps}</Text>
            <Text style={styles.statLabel}>Total Questions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#2d6a4f" />
            </View>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="time" size={20} color="#1565c0" />
            </View>
            <Text style={styles.statValue}>{totalSteps - completedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Main Survey Card */}
        <View style={styles.mainCard}>
          {/* Survey Header */}
          <LinearGradient
            colors={['#1b4332', '#2d6a4f', '#40916c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.surveyHeaderGradient}
          >
            <View style={styles.surveyHeaderSection}>
              <View style={styles.surveyTitleRow}>
                <View style={styles.surveyIconBox}>
                  <Ionicons name="clipboard" size={28} color="#FFD700" />
                </View>
                <View style={styles.surveyTitleContent}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
              {survey.description && (
                <Text style={styles.surveyDescription}>{survey.description}</Text>
              )}
            </View>
          </LinearGradient>

          {/* Survey Meta */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="list-outline" size={16} color="#2d6a4f" />
              <Text style={styles.metaText}>{totalSteps} Questions</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#2d6a4f" />
              <Text style={styles.metaText}>{completedCount} Answered</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#2d6a4f" />
              <Text style={styles.metaText}>Nov 6, 2025</Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelGroup}>
                <Ionicons name="analytics-outline" size={16} color="#2d6a4f" />
                <Text style={styles.progressLabel}>Overall Progress</Text>
              </View>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarOuter}>
              <LinearGradient
                colors={['#1b4332', '#2d6a4f', '#40916c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarInner, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              Question {currentStep + 1} of {totalSteps} • {totalSteps - currentStep - 1} remaining
            </Text>
          </View>

          <View style={styles.sectionDivider} />

          {/* Question Section */}
          <Animated.View 
            style={[
              styles.questionSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.questionHeaderBox}>
              <LinearGradient
                colors={['#1b4332', '#2d6a4f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.questionBadge}
              >
                <Text style={styles.questionBadgeText}>Q{currentStep + 1}</Text>
              </LinearGradient>
              <View style={styles.questionTextContent}>
                <Text style={styles.questionTitle}>
                  {currentField.label}
                  {currentField.required && <Text style={styles.requiredMark}> *</Text>}
                </Text>
                {currentField.placeholder && (
                  <Text style={styles.questionHint}>{currentField.placeholder}</Text>
                )}
              </View>
            </View>

            {/* Input Area */}
            <View style={styles.inputSection}>
              {renderField(currentField)}
            </View>
          </Animated.View>

          {/* Navigation Controls */}
          <View style={styles.navigationSection}>
            <View style={styles.navButtons}>
              {currentStep > 0 && (
                <TouchableOpacity 
                  style={styles.prevButton}
                  onPress={handlePrevious}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={20} color="#666" />
                  <Text style={styles.prevButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < totalSteps - 1 ? (
                <LinearGradient
                  colors={['#1b4332', '#2d6a4f', '#40916c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.nextButton, currentStep === 0 && styles.fullWidthButton]}
                >
                  <TouchableOpacity 
                    onPress={handleNext}
                    activeOpacity={0.8}
                    style={styles.gradientButtonContent}
                  >
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity 
                  style={[styles.submitButton, currentStep === 0 && styles.fullWidthButton]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={styles.submitButtonText}>Submit Survey</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Question Navigator */}
        <View style={styles.navigatorCard}>
          <View style={styles.navigatorHeader}>
            <Ionicons name="grid-outline" size={18} color="#2d6a4f" />
            <Text style={styles.navigatorTitle}>Question Navigator</Text>
          </View>
          <View style={styles.navigatorGrid}>
            {survey.fields.map((field, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.navigatorDot,
                  idx === currentStep && styles.navigatorDotActive,
                  responses[field.label] && styles.navigatorDotCompleted
                ]}
                onPress={() => setCurrentStep(idx)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.navigatorDotText,
                  idx === currentStep && styles.navigatorDotTextActive,
                  responses[field.label] && styles.navigatorDotTextCompleted
                ]}>
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNav active="ResLib" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  plusButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  surveyHeaderGradient: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  surveyHeaderSection: {
    marginBottom: 0,
  },
  surveyTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  surveyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  surveyTitleContent: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#e8f5e9',
    lineHeight: 22,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 18,
    marginTop: 18,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#666',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 18,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionHeaderBox: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  questionBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  questionTextContent: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    marginBottom: 4,
  },
  requiredMark: {
    color: '#dc2626',
  },
  questionHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 0,
  },
  fieldWrapper: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  navigationSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  prevButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 6,
  },
  gradientButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  navigatorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  navigatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  navigatorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  navigatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  navigatorDot: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigatorDotActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
  },
  navigatorDotCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2d6a4f',
  },
  navigatorDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  navigatorDotTextActive: {
    color: '#fff',
  },
  navigatorDotTextCompleted: {
    color: '#2d6a4f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '700',
    marginBottom: 6,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '700',
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  successIconWrapper: {
    marginBottom: 24,
  },
  successIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
  },
  successActions: {
    width: '100%',
  },
  successButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});