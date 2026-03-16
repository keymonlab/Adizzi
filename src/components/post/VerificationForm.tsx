import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';

interface VerificationFormProps {
  enabled: boolean;
  question: string;
  answer: string;
  onToggle: (value: boolean) => void;
  onQuestionChange: (text: string) => void;
  onAnswerChange: (text: string) => void;
  questionError?: string;
  answerError?: string;
}

export function VerificationForm({
  enabled,
  question,
  answer,
  onToggle,
  onQuestionChange,
  onAnswerChange,
  questionError,
  answerError,
}: VerificationFormProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>소유 확인 질문 설정</Text>
          <Text style={styles.toggleSub}>선택 사항</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>

      {enabled && (
        <View style={styles.fields}>
          <Text style={styles.helperText}>
            분실물 주인만 알 수 있는 질문을 설정하세요
          </Text>
          <Input
            label="질문"
            placeholder="가방에 적힌 이름은?"
            value={question}
            onChangeText={onQuestionChange}
            error={questionError}
          />
          <Input
            label="정답"
            placeholder="정답을 입력하세요"
            value={answer}
            onChangeText={onAnswerChange}
            error={answerError}
            secureTextEntry
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelGroup: {
    gap: 2,
  },
  toggleLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  fields: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
