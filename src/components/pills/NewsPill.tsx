import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Globe } from 'lucide-react';

interface Article {
  title: string;
  link: string;
  source: string;
  date: string;
  snippet?: string;
}

export function NewsPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [refreshing, setRefreshing] = useState(false);

  const articles: Article[] = data?.articles || [];
  const topic = data?.topic || 'Top Stories';

  if (articles.length === 0) {
    return (
      <div style={{
        width: '100%', height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1A1A1A', color: '#6A6A70',
        fontSize: 12,
      }}>
        No news available right now.
      </div>
    );
  }

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await (window as any).electronAPI?.executeTool?.('get_news', { topic: topic !== 'Top Stories' ? topic : '' }, {});
    } catch { }
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ''; }
  };

  // ─── COMPACT VIEW ───
  if (!expanded) {
    const topArticle = articles[0];
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(320); }}
        style={{
          width: '100%', height: 64,
          background: '#1A1A1A',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#FF3B3022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0,
        }}>
          <Globe size={20} color="#FF3B30" />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topArticle.title}
          </div>
          <div style={{ fontSize: 10, color: '#6A6A70', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, color: '#A0A0A5' }}>{topArticle.source}</span>
            <span>·</span>
            <span>{getTimeAgo(topArticle.date)}</span>
          </div>
        </div>

        <div style={{ fontSize: 9, fontWeight: 600, color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, background: '#FF3B3022', padding: '2px 6px', borderRadius: 6 }}>
          News
        </div>
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div style={{
      width: '100%', minHeight: 320, maxHeight: defaultExpanded ? 'none' : 440,
      overflowY: 'auto',
      background: '#18181A',
      padding: '30px 22px 22px',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
    }}>
      {/* Collapse */}
      {!defaultExpanded && (
        <div
          onClick={() => { setExpanded(false); if (onExpand) onExpand(64); }}
          style={{
            position: 'absolute', top: 12, left: 18,
            cursor: 'pointer', opacity: 0.4,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: '#A0A0A5', zIndex: 2,
          }}
        >
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>‹</span>
          <span>collapse</span>
        </div>
      )}

      {/* Refresh */}
      <motion.div
        animate={refreshing ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
        onClick={handleRefresh}
        style={{ position: 'absolute', top: 12, right: 18, cursor: 'pointer', opacity: 0.5 }}
      >
        <RefreshCw size={13} color="#A0A0A5" />
      </motion.div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 4 }}>
        <Globe size={18} color="#FF3B30" />
        <span style={{ fontSize: 16, fontWeight: 700 }}>{topic}</span>
      </div>

      {/* Articles Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {articles.map((article, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => (window as any).electronAPI?.openExternal(article.link)}
            style={{ 
              display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', 
              borderRadius: 12, border: '1px solid #2A2A2E', background: 'rgba(25, 25, 28, 0.4)',
              cursor: 'pointer'
            }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFEB', lineHeight: 1.4 }}>
              {article.title}
            </div>
            {article.snippet && (
              <div style={{ fontSize: 11, color: '#A0A0A5', lineHeight: 1.5, marginTop: 2 }}>
                {article.snippet}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6A6A70' }}>
                <span style={{ fontWeight: 600, color: '#FF3B30', background: '#FF3B3015', padding: '2px 6px', borderRadius: 4 }}>{article.source}</span>
                <span>·</span>
                <span>{getTimeAgo(article.date)}</span>
              </div>
              <ExternalLink size={12} color="#888" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const newsPillMeta = { name: 'News', height: 64, keywords: ['news', 'breaking', 'headlines', 'article', 'story', 'stories'] };
