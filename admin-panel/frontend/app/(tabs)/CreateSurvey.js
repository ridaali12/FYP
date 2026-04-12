import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../../components/BottomNav';

export default function CreateSurveyForm() {
  const router = useRouter();
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
  });

  const fieldTypes = [
    { id: 'text', name: 'Text Input', icon: 'text' },
    { id: 'number', name: 'Number', icon: 'calculator' },
    { id: 'textarea', name: 'Long Text', icon: 'document-text' },
    { id: 'dropdown', name: 'Dropdown', icon: 'chevron-down-circle' },
    { id: 'checkbox', name: 'Checkbox', icon: 'checkbox' },
    { id: 'date', name: 'Date', icon: 'calendar' },
    { id: 'time', name: 'Time', icon: 'time' },
  ];

  const addField = () => {
    if (newField.label.trim()) {
      if (editingField !== null) {
        const updatedFields = [...fields];
        updatedFields[editingField] = { ...newField };
        setFields(updatedFields);
        setEditingField(null);
      } else {
        setFields([...fields, { ...newField }]);
      }
      resetNewField();
      setShowFieldModal(false);
    }
  };

  const resetNewField = () => {
    setNewField({
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
    });
  };

  const editField = (index) => {
    setNewField(fields[index]);
    setEditingField(index);
    setShowFieldModal(true);
  };

  const deleteField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSaveSurvey = async () => {
    if (!surveyTitle.trim()) {
      Alert.alert('Error', 'Please enter a survey title');
      return;
    }
    if (fields.length === 0) {
      Alert.alert('Error', 'Please add at least one field');
      return;
    }

    const surveyData = {
      id: Date.now().toString(),
      title: surveyTitle,
      description: surveyDescription,
      fields: fields,
      createdAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem('currentSurvey', JSON.stringify(surveyData));
      router.push('/(tabs)/DisplaySurvey');
    } catch (error) {
      Alert.alert('Error', 'Failed to save survey');
      console.error(error);
    }
  };

  const handleBackPress = () => {
    router.push('/(tabs)/ResearcherHub');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Survey</Text>
        <TouchableOpacity 
          onPress={handleSaveSurvey}
          style={styles.headerButton}
          disabled={!surveyTitle.trim() || fields.length === 0}
        >
          <Ionicons 
            name="checkmark" 
            size={24} 
            color={surveyTitle.trim() && fields.length > 0 ? "#FFD700" : "#d1d5db"} 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="create" size={40} color="#FFD700" />
          </View>
          <Text style={styles.introTitle}>Design Your Survey</Text>
          <Text style={styles.introSubtitle}>
            Create custom forms to collect wildlife data from users
          </Text>
        </View>

        {/* Survey Basic Info */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Survey Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Wildlife Sighting Report"
              placeholderTextColor="#9ca3af"
              value={surveyTitle}
              onChangeText={setSurveyTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of what data you're collecting..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={surveyDescription}
              onChangeText={setSurveyDescription}
            />
          </View>

          {/* Fields Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Form Fields</Text>
            <View style={styles.fieldCountBadge}>
              <Text style={styles.fieldCount}>{fields.length} field{fields.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Field List */}
          {fields.map((field, index) => (
            <View key={index} style={styles.fieldCard}>
              <View style={styles.fieldInfo}>
                <View style={styles.fieldHeader}>
                  <Ionicons 
                    name={fieldTypes.find(t => t.id === field.type)?.icon || 'text'} 
                    size={20} 
                    color="#406040" 
                  />
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  {field.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.fieldType}>
                  {fieldTypes.find(t => t.id === field.type)?.name}
                </Text>
              </View>
              
              <View style={styles.fieldActions}>
                <TouchableOpacity 
                  onPress={() => moveField(index, 'up')}
                  disabled={index === 0}
                  style={styles.actionButton}
                >
                  <Ionicons name="arrow-up" size={18} color={index === 0 ? '#d1d5db' : '#406040'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => moveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  style={styles.actionButton}
                >
                  <Ionicons name="arrow-down" size={18} color={index === fields.length - 1 ? '#d1d5db' : '#406040'} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => editField(index)}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={18} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteField(index)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Field Button */}
          <TouchableOpacity 
            style={styles.addFieldButton}
            onPress={() => setShowFieldModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#FFD700" />
            <Text style={styles.addFieldText}>Add New Field</Text>
          </TouchableOpacity>

          {/* Preview & Share Button */}
          {fields.length > 0 && surveyTitle.trim() && (
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleSaveSurvey}
            >
              <Ionicons name="eye" size={20} color="#1f2937" />
              <Text style={styles.shareButtonText}>Preview & Save Survey</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Field Modal */}
      <Modal
        visible={showFieldModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowFieldModal(false);
          resetNewField();
          setEditingField(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingField !== null ? 'Edit Field' : 'Add New Field'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowFieldModal(false);
                resetNewField();
                setEditingField(null);
              }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Field Label */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Field Label <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Species Name"
                  placeholderTextColor="#9ca3af"
                  value={newField.label}
                  onChangeText={(text) => setNewField({...newField, label: text})}
                />
              </View>

              {/* Field Type */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Field Type</Text>
                <View style={styles.fieldTypeGrid}>
                  {fieldTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.fieldTypeButton,
                        newField.type === type.id && styles.fieldTypeButtonActive
                      ]}
                      onPress={() => setNewField({...newField, type: type.id})}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={20} 
                        color={newField.type === type.id ? '#406040' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.fieldTypeText,
                        newField.type === type.id && styles.fieldTypeTextActive
                      ]}>
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Placeholder */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Placeholder Text</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Enter species name..."
                  placeholderTextColor="#9ca3af"
                  value={newField.placeholder}
                  onChangeText={(text) => setNewField({...newField, placeholder: text})}
                />
              </View>

              {/* Required Toggle */}
              <TouchableOpacity 
                style={styles.toggleRow}
                onPress={() => setNewField({...newField, required: !newField.required})}
              >
                <View>
                  <Text style={styles.modalLabel}>Required Field</Text>
                  <Text style={styles.toggleDescription}>Users must fill this field</Text>
                </View>
                <View style={[
                  styles.toggle,
                  newField.required && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleDot,
                    newField.required && styles.toggleDotActive
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Add Button */}
              <TouchableOpacity 
                style={[styles.modalAddButton, !newField.label.trim() && styles.modalAddButtonDisabled]}
                onPress={addField}
                disabled={!newField.label.trim()}
              >
                <Text style={styles.modalAddButtonText}>
                  {editingField !== null ? 'Update Field' : 'Add Field'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNav active="ResLib" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  container: {
    paddingBottom: 100,
  },
  introSection: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  fieldCountBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  fieldCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 10,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: '700',
  },
  fieldType: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 30,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  addFieldText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#406040',
    marginLeft: 8,
  },
  shareButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareButtonText: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  fieldTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minWidth: '47%',
  },
  fieldTypeButtonActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#FFD700',
  },
  fieldTypeText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  fieldTypeTextActive: {
    color: '#406040',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FFD700',
    alignItems: 'flex-end',
  },
  toggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleDotActive: {
    marginRight: 0,
  },
  modalAddButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalAddButtonDisabled: {
    backgroundColor: '#d1d5db',
    elevation: 0,
  },
  modalAddButtonText: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
});