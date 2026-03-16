export type PostType = 'lost' | 'found';

export type Category = 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';

export type PostStatus = 'active' | 'resolved';

export type ClaimStatus = 'pending' | 'verified' | 'rejected';

export type NotificationType =
  | 'new_post'
  | 'comment'
  | 'mention'
  | 'claim'
  | 'resolved'
  | 'lost_alert_match';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export type CategoryInfo = {
  value: Category;
  label: string;
  icon: string;
};
