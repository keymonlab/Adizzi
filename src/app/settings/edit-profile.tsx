import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/services/users.service';
import { HandleInput } from '@/components/auth/HandleInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);

  // Sync form state once profile loads asynchronously (profile is null on first render)
  useEffect(() => {
    if (profile) {
      setDisplayName((prev) => (prev === '' ? (profile.display_name ?? '') : prev));
      setHandle((prev) => (prev === '' ? (profile.handle ?? '') : prev));
      setAvatarUrl((prev) => (prev === null ? (profile.avatar_url ?? null) : prev));
    }
  }, [profile]);
  const [handleAvailable, setHandleAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !user) return;

    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const filename = `${user.id}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      await supabase.storage.from('avatars').upload(filename, new Uint8Array(arrayBuffer), {
        contentType: 'image/jpeg',
        upsert: true,
      });

      const { data } = supabase.storage.from('avatars').getPublicUrl(filename);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      Alert.alert('오류', '사진 업로드에 실패했어요.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      Alert.alert('알림', '이름을 입력해 주세요.');
      return;
    }

    const handleChanged = handle !== profile?.handle;
    if (handleChanged && !handleAvailable) {
      Alert.alert('알림', '사용할 수 없는 핸들이에요.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: trimmedName,
        handle: handle,
        ...(avatarUrl !== profile?.avatar_url && { avatar_url: avatarUrl ?? undefined }),
      });
      await refreshProfile();
      router.back();
    } catch (err) {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }, [user, displayName, handle, handleAvailable, avatarUrl, profile, refreshProfile]);

  const handleAvailabilityChange = useCallback((available: boolean) => {
    // If handle hasn't changed from current, treat as available
    if (handle === profile?.handle) {
      setHandleAvailable(true);
    } else {
      setHandleAvailable(available);
    }
  }, [handle, profile?.handle]);

  const isSaveDisabled = saving || uploadingAvatar || !displayName.trim();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(displayName || profile?.display_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={pickAvatar}
            disabled={uploadingAvatar}
            style={styles.changePhotoButton}
          >
            <Text style={styles.changePhotoText}>
              {uploadingAvatar ? '업로드 중...' : '사진 변경'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Fields */}
        <View style={styles.fieldsSection}>
          <Input
            label="이름"
            placeholder="표시할 이름을 입력하세요"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={30}
          />

          <View style={styles.fieldGap} />

          <HandleInput
            value={handle}
            onChangeText={setHandle}
            onAvailabilityChange={handleAvailabilityChange}
            label="핸들"
          />
        </View>

        <View style={styles.divider} />

        {/* Save button */}
        <View style={styles.saveSection}>
          <Button
            title="저장"
            onPress={handleSave}
            loading={saving}
            disabled={isSaveDisabled}
            size="lg"
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 100;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minWidth: 64,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    minWidth: 64,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.surface,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.text,
  },
  changePhotoButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },
  fieldsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  fieldGap: {
    height: Spacing.md,
  },
  saveSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    width: '100%',
  },
});
