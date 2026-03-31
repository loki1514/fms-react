// components/modals/TicketCreateModal.tsx - Ticket creation modal with AI classification
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput, Image,
  ActivityIndicator, Alert, ScrollView, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { springs } from '@/animations/reanimated-presets';
import { resolveClassification } from '@/lib/ai';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  organizationId?: string;
  onSuccess?: (ticket: any) => void;
  isAdminMode?: boolean;
}

interface Classification {
  category: string | null;
  confidence: number;
  isVague: boolean;
  priority?: string;
  reasoning?: string;
}

export function TicketCreateModal({
  isOpen,
  onClose,
  propertyId: propPropertyId,
  organizationId: propOrganizationId,
  onSuccess,
  isAdminMode = false,
}: TicketCreateModalProps) {
  const { user, membership } = useAuth();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Admin mode state
  const [selectedOrgId, setSelectedOrgId] = useState(propOrganizationId || '');
  const [selectedPropId, setSelectedPropId] = useState(propPropertyId || '');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);

  // Animations
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.95);
  const modalOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  // Fetch organizations for admin mode
  useEffect(() => {
    if (isAdminMode && isOpen) {
      fetchOrganizations();
    }
  }, [isAdminMode, isOpen]);

  // Update selected values when props change
  useEffect(() => {
    if (propOrganizationId) setSelectedOrgId(propOrganizationId);
    if (propPropertyId) setSelectedPropId(propPropertyId);
  }, [propOrganizationId, propPropertyId]);

  // Modal animation
  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSpring(1, springs.smooth);
      modalOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.95, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isOpen]);

  // Success animation
  useEffect(() => {
    if (success) {
      successScale.value = withSpring(1, springs.bouncy);
    }
  }, [success]);

  // AI thinking pulse animation
  useEffect(() => {
    if (aiThinking) {
      const interval = setInterval(() => {
        pulseAnim.value = withSpring(pulseAnim.value === 1 ? 1.2 : 1, { damping: 10 });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [aiThinking]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('status', 'active');
      
      if (!error && data) {
        setOrganizations(data);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  };

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedPropId('');
    
    if (orgId) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, name, code')
          .eq('organization_id', orgId)
          .eq('status', 'active');
        
        if (!error && data) {
          setAvailableProperties(data);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      }
    } else {
      setAvailableProperties([]);
    }
  };

  // AI Classification on description change
  const classifyDescription = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 10) {
      setClassification(null);
      return;
    }

    setAiThinking(true);
    setError(null);

    try {
      const result = await resolveClassification(text, title);
      
      setClassification({
        category: result.category,
        confidence: result.confidence,
        isVague: result.confidence < 70,
        priority: result.priority,
        reasoning: result.reasoning,
      });
    } catch (err) {
      console.warn('AI classification failed:', err);
      setClassification(null);
    } finally {
      setAiThinking(false);
    }
  }, [title]);

  // Debounced classification
  useEffect(() => {
    const timer = setTimeout(() => {
      if (description.trim().length >= 10) {
        classifyDescription(description);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [description, classifyDescription]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery access to attach photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  const uploadPhoto = async (ticketId: string) => {
    if (!photoBase64) return;

    try {
      const fileName = `${ticketId}/before_${Date.now()}.jpg`;
      const filePath = `ticket-photos/${fileName}`;

      const { error } = await supabase.storage
        .from('ticket-photos')
        .upload(filePath, decode(photoBase64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ticket-photos')
        .getPublicUrl(filePath);

      // Update ticket with photo URL
      await supabase
        .from('tickets')
        .update({ photo_before_url: urlData.publicUrl })
        .eq('id', ticketId);

    } catch (err) {
      console.error('Photo upload failed:', err);
    }
  };

  // Helper to decode base64 to Uint8Array (React Native compatible)
  const decode = (base64: string): Uint8Array => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    
    const len = base64.length;
    let bufferLength = base64.length * 0.75;
    if (base64[len - 1] === '=') {
      bufferLength--;
      if (base64[len - 2] === '=') {
        bufferLength--;
      }
    }
    
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    let encoded1 = 0, encoded2 = 0, encoded3 = 0, encoded4 = 0;
    
    for (let i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      
      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      if (encoded3 !== 64) {
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      }
      if (encoded4 !== 64) {
        bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
      }
    }
    
    return bytes;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }

    const finalOrgId = isAdminMode ? selectedOrgId : membership?.org_id;
    const finalPropId = isAdminMode ? selectedPropId : membership?.properties?.[0]?.id;

    if (!finalOrgId || !finalPropId) {
      setError('Please select an organization and property');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create ticket via Supabase
      const { data: ticket, error: insertError } = await supabase
        .from('tickets')
        .insert({
          title: title.trim() || description.trim().slice(0, 50),
          description: description.trim(),
          category: classification?.category || 'General',
          priority: classification?.priority || 'medium',
          property_id: finalPropId,
          organization_id: finalOrgId,
          raised_by: user?.id,
          raised_by_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tenant',
          status: 'open',
          ai_confidence: classification?.confidence,
          ai_category: classification?.category,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload photo if exists
      if (photoBase64 && ticket?.id) {
        await uploadPhoto(ticket.id);
      }

      setSuccess(true);
      onSuccess?.(ticket);

      // Auto-close after success
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setPhotoUri(null);
    setPhotoBase64(null);
    setClassification(null);
    setError(null);
    setSuccess(false);
    successScale.value = 0;
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
            isDark ? Shadows.lg : Shadows.glass,
            modalStyle,
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {success ? 'Success!' : 'Raise a New Request'}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {success ? (
              <View style={styles.successContainer}>
                <Animated.View style={[styles.successIcon, successIconStyle]}>
                  <View style={[styles.checkCircle, { backgroundColor: Colors.success }]}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </View>
                </Animated.View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                  Request Submitted!
                </Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                  Your request has been created and will be reviewed shortly.
                </Text>
                
                {classification && (
                  <View style={[styles.classificationBadge, { backgroundColor: `${Colors.primary}15` }]}>
                    <Text style={[styles.classificationText, { color: Colors.primary }]}>
                      AI Category: {classification.category} ({classification.confidence}%)
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.form}>
                {/* Admin Mode - Org/Property Selection */}
                {isAdminMode && (
                  <View style={styles.adminRow}>
                    <View style={styles.adminField}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Organization</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                          {organizations.map((org) => (
                            <Pressable
                              key={org.id}
                              onPress={() => handleOrgChange(org.id)}
                              style={[
                                styles.orgChip,
                                selectedOrgId === org.id && { backgroundColor: Colors.primary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  { color: selectedOrgId === org.id ? '#fff' : colors.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {org.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    <View style={styles.adminField}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Property</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                          {availableProperties.map((prop) => (
                            <Pressable
                              key={prop.id}
                              onPress={() => setSelectedPropId(prop.id)}
                              disabled={!selectedOrgId}
                              style={[
                                styles.orgChip,
                                !selectedOrgId && { opacity: 0.5 },
                                selectedPropId === prop.id && { backgroundColor: Colors.primary },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  { color: selectedPropId === prop.id ? '#fff' : colors.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {prop.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                )}

                {/* Title Input */}
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Title (optional)</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Brief title of the issue"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                {/* Description Input */}
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Description *</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the issue in your own words...&#10;Example: Leaking tap in kitchenette, 2nd floor"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.surfaceElevated,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                {/* AI Classification Indicator */}
                {aiThinking && (
                  <Animated.View style={[styles.aiThinking, pulseStyle]}>
                    <View style={styles.aiIcon}>
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                    </View>
                    <Text style={[styles.aiText, { color: Colors.primary }]}>
                      AI is analyzing your request...
                    </Text>
                  </Animated.View>
                )}

                {/* Classification Result */}
                {classification && !aiThinking && (
                  <View style={[styles.classificationResult, { backgroundColor: `${Colors.primary}10` }]}>
                    <View style={styles.classificationHeader}>
                      <Ionicons name="brain" size={16} color={Colors.primary} />
                      <Text style={[styles.classificationTitle, { color: Colors.primary }]}>
                        AI Classification
                      </Text>
                    </View>
                    <Text style={[styles.classificationDetail, { color: colors.textSecondary }]}>
                      Category: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{classification.category}</Text>
                    </Text>
                    <Text style={[styles.classificationDetail, { color: colors.textSecondary }]}>
                      Priority: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{classification.priority}</Text>
                    </Text>
                    <Text style={[styles.classificationDetail, { color: colors.textSecondary }]}>
                      Confidence: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{classification.confidence}%</Text>
                    </Text>
                    {classification.reasoning && (
                      <Text style={[styles.classificationReasoning, { color: colors.textTertiary }]}>
                        "{classification.reasoning}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Photo Preview */}
                {photoUri && (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    <Pressable onPress={removePhoto} style={styles.removePhotoBtn}>
                      <View style={styles.removePhotoCircle}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* Error */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
                  </View>
                )}

                {/* Spacer for bottom actions */}
                <View style={{ height: 100 }} />
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          {!success && (
            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <Pressable onPress={pickImage} style={styles.actionBtn}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Gallery</Text>
              </Pressable>

              <Pressable onPress={takePhoto} style={styles.actionBtn}>
                <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>Camera</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !description.trim()}
                style={[
                  styles.submitBtn,
                  (!description.trim() || isSubmitting) && { opacity: 0.5 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitText}>Submit</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    fontWeight: '700',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMedium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Typography.bodyMedium,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  adminRow: {
    marginBottom: Spacing.md,
  },
  adminField: {
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  orgChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  chipText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
  aiThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiText: {
    ...Typography.labelMedium,
    fontWeight: '500',
  },
  classificationResult: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  classificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  classificationTitle: {
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  classificationDetail: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  classificationReasoning: {
    ...Typography.labelSmall,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  photoPreview: {
    position: 'relative',
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 150,
    borderRadius: Radius.lg,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  removePhotoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.labelSmall,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(150,150,150,0.1)',
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },
  submitText: {
    color: '#fff',
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    ...Typography.headlineLarge,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  classificationBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  classificationText: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
});

export default TicketCreateModal;
