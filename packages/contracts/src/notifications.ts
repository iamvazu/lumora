export interface NotificationDto {
  id: string;
  userId: string;
  type:
    | 'new_subscriber'
    | 'subscription_renewed'
    | 'tip_received'
    | 'ppv_purchased'
    | 'new_message'
    | 'post_liked'
    | 'post_commented'
    | 'payout_processed'
    | 'system_alert';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
