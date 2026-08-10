import { Bell, AlertCircle } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function NotificationPill() {
  return (
    <div style={{
      width: '100%',
      background: '#1C1C1E',
      padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxSizing: 'border-box', borderRadius: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: '#88888815', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bell size={15} color="#A0A0A5" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5EB', marginBottom: 4 }}>
          Notifications
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <AlertCircle size={11} color="#FF8C00" />
          <span style={{ fontSize: 11, color: '#FF8C00', fontWeight: 600 }}>Not connected</span>
        </div>
        <div style={{ fontSize: 11, color: '#6A6A70', lineHeight: 1.5 }}>
          OS-level notification sync is coming soon. You'll be able to see and reply to your messages directly from Whispr.
        </div>
      </div>
    </div>
  );
}
export const notificationPillMeta = { name: 'Notification', height: 100, keywords: ['notifications', 'messages', 'alerts', 'inbox'] };
