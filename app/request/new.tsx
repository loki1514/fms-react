import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Cleaning', 
  'Security', 'Elevator', 'Parking', 'General', 'Other',
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: Colors.info },
  { value: 'medium', label: 'Medium', color: Colors.warning },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'critical', label: 'Critical', color: Colors.error },
];

export default function NewRequestScreen() {
  const { user, membership } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery access to attach photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
    });

    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
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
    });

    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 4));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your request.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    setLoading(true);
    try {
      // Upload first photo if present
      let photoUrl: string | undefined;
      if (photos.length > 0) {
        try {
          const { uploadImage } = await import('@/lib/storage');
          photoUrl = await uploadImage(photos[0], 'ticket-photos', 'before');
        } catch (uploadErr) {
          console.warn('Photo upload failed, submitting without photo:', uploadErr);
        }
      }

      // Submit ticket via Supabase
      const propertyId = membership?.properties?.[0]?.id;
      const orgId = membership?.org_id;
      if (!user?.id || !propertyId || !orgId) throw new Error('Not authenticated');

      const { error: insertErr } = await supabase
        .from('tickets')
        .insert({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          photo_before_url: photoUrl || null,
          raised_by: user.id,
          raised_by_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tenant',
          property_id: propertyId,
          organization_id: orgId,
          status: 'open',
        });

      if (insertErr) throw insertErr;

      Alert.alert('Success!', 'Your request has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Raise a Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              borderColor: colors.border,
            }]}
            placeholder="e.g. Leaky faucet in kitchen"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              borderColor: colors.border,
            }]}
            placeholder="Describe the issue in detail..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Category */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category *</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat ? Colors.primary : 'transparent',
                    borderColor: category === cat ? Colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipLabel,
                  { color: category === cat ? '#fff' : colors.textSecondary },
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: priority === p.value ? `${p.color}20` : 'transparent',
                    borderColor: priority === p.value ? p.color : colors.border,
                  },
                ]}
                onPress={() => setPriority(p.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text style={[
                  styles.chipLabel,
                  { color: priority === p.value ? p.color : colors.textSecondary },
                ]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photos */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Photos (optional)</Text>
          <View style={styles.photoRow}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => removePhoto(idx)}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.addPhotoBtnSmall, { borderColor: colors.border }]}
                  onPress={pickImage}
                >
                  <Ionicons name="images-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addPhotoBtnSmall, { borderColor: colors.border }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { ...Typography.headlineMedium },
  form: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  label: {
    ...Typography.labelMedium,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyMedium,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipLabel: { ...Typography.labelMedium },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addPhotoBtnSmall: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  submitText: {
    color: '#fff',
    ...Typography.titleMedium,
    fontWeight: '600',
  },
});
