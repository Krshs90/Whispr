import { PillLayout } from './PillLayout';

export function NotificationPill({ app, message, iconUrl, iconColor }: { app: string; message: string; iconUrl?: string; iconColor?: string }) {
  return (
    <PillLayout height={56}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2A2A2A', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {iconUrl ? (
            <img src={iconUrl} alt={app} style={{ width: 18, height: 18 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: 4, background: iconColor || '#888' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{app}</div>
            <span style={{ fontSize: 8, background: '#88888820', color: '#888', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Coming Soon</span>
          </div>
          <div style={{ fontSize: 12, color: '#FFFFEB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message}</div>
        </div>
        <span style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>now</span>
      </div>
    </PillLayout>
  );
}
export const notificationPillMeta = { name: 'Notification', height: 56, keywords: ['gmail', 'email', 'message', 'text', 'notification'] };
