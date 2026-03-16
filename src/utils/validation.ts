export interface PostFormErrors {
  title?: string;
  description?: string;
  category?: string;
  images?: string;
  verificationQuestion?: string;
  verificationAnswer?: string;
}

export function validatePostForm(data: {
  title: string;
  description: string;
  category?: string;
  images: string[];
  verificationEnabled: boolean;
  verificationQuestion?: string;
  verificationAnswer?: string;
}): PostFormErrors {
  const errors: PostFormErrors = {};
  if (!data.title.trim()) errors.title = '제목을 입력해주세요';
  if (data.title.length > 100) errors.title = '제목은 100자 이내로 입력해주세요';
  if (!data.description.trim()) errors.description = '설명을 입력해주세요';
  if (!data.category) errors.category = '카테고리를 선택해주세요';
  // Images are optional — no validation error when none are attached
  if (data.verificationEnabled) {
    if (!data.verificationQuestion?.trim()) errors.verificationQuestion = '질문을 입력해주세요';
    if (!data.verificationAnswer?.trim()) errors.verificationAnswer = '정답을 입력해주세요';
  }
  return errors;
}

export function validateHandle(handle: string): string | null {
  if (handle.length < 3) return '3자 이상 입력해주세요';
  if (handle.length > 20) return '20자 이하로 입력해주세요';
  if (!/^[a-z0-9_]+$/.test(handle)) return '영문 소문자, 숫자, _만 사용 가능합니다';
  return null;
}
