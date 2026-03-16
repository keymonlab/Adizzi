import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useCreatePost } from '@/hooks/usePosts';
import { ImagePicker } from '@/components/post/ImagePicker';
import { CategoryPicker } from '@/components/post/CategoryPicker';
import { LocationPicker } from '@/components/post/LocationPicker';
import { VerificationForm } from '@/components/post/VerificationForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validatePostForm } from '@/utils/validation';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import type { Category, PostType } from '@/types/app.types';

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

export default function CreateScreen(): React.ReactElement {
  const { user, profile } = useAuth();
  const { images, uploading, pickImages, takePhoto, removeImage, uploadImages } = useImageUpload();
  const { mutateAsync: createPost, isPending } = useCreatePost();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState<PostType>('lost');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubmitting = uploading || isPending;

  const handleSubmit = async () => {
    const formErrors = validatePostForm({
      title,
      description,
      category,
      images,
      verificationEnabled,
      verificationQuestion,
      verificationAnswer,
    });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors as Record<string, string>);
      return;
    }

    if (!user || !profile?.neighborhood_id) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      const imageUrls = await uploadImages(user.id);

      await createPost({
        data: {
          post_type: postType,
          title: title.trim(),
          description: description.trim(),
          category: category!,
          location: location ? { lat: location.lat, lng: location.lng } : null,
          location_name: location?.name ?? null,
          image_urls: imageUrls,
          neighborhood_id: profile.neighborhood_id,
          verification_question: verificationEnabled ? verificationQuestion.trim() : null,
          verification_answer_hash: verificationEnabled ? verificationAnswer.trim() : null,
        },
        authorId: user.id,
      });

      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('오류', '게시글 등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{postType === 'lost' ? '잃어버렸어요' : '주웠어요'}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, postType === 'lost' && styles.typeButtonActive]}
          onPress={() => setPostType('lost')}
        >
          <Text style={[styles.typeButtonText, postType === 'lost' && styles.typeButtonTextActive]}>
            잃어버렸어요
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, postType === 'found' && styles.typeButtonActive]}
          onPress={() => setPostType('found')}
        >
          <Text style={[styles.typeButtonText, postType === 'found' && styles.typeButtonTextActive]}>
            주웠어요
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>사진</Text>
          <ImagePicker
            images={images}
            onPickImages={pickImages}
            onTakePhoto={takePhoto}
            onRemoveImage={removeImage}
          />
          {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
        </View>

        <View style={styles.section}>
          <Input
            label="제목"
            placeholder={postType === 'lost' ? '잃어버린 물건을 입력해주세요' : '주운 물건을 입력해주세요'}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            maxLength={100}
            error={errors.title}
          />
        </View>

        <View style={styles.section}>
          <Input
            label="설명"
            placeholder={postType === 'lost' ? '어디서 잃어버렸는지 자세히 설명해주세요' : '어디서 주웠는지 자세히 설명해주세요'}
            value={description}
            onChangeText={(t) => {
              setDescription(t);
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            multiline
            error={errors.description}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>카테고리</Text>
          <CategoryPicker
            selected={category}
            onSelect={(cat) => {
              setCategory(cat);
              if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
            }}
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>위치</Text>
          <LocationPicker value={location} onChange={setLocation} />
        </View>

        <View style={styles.section}>
          <VerificationForm
            enabled={verificationEnabled}
            question={verificationQuestion}
            answer={verificationAnswer}
            onToggle={setVerificationEnabled}
            onQuestionChange={(t) => {
              setVerificationQuestion(t);
              if (errors.verificationQuestion)
                setErrors((prev) => ({ ...prev, verificationQuestion: '' }));
            }}
            onAnswerChange={(t) => {
              setVerificationAnswer(t);
              if (errors.verificationAnswer)
                setErrors((prev) => ({ ...prev, verificationAnswer: '' }));
            }}
            questionError={errors.verificationQuestion}
            answerError={errors.verificationAnswer}
          />
        </View>

        <Button
          title="등록하기"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          size="lg"
          style={styles.submitButton}
        />
      </ScrollView>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {uploading ? '사진을 업로드하는 중...' : '게시글을 등록하는 중...'}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 2,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.textOnPrimary,
  },
});
