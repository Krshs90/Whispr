import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Globe, Cpu, Briefcase, Sparkles, Trophy, Gamepad2, Newspaper, ChevronDown } from 'lucide-react';

interface Article {
  title: string;
  link: string;
  source?: string;
  publisher?: string;
  date?: string;
  time?: string;
  snippet?: string;
  faviconUrl?: string | null;
  imageUrl?: string | null;
  category?: string;
}

const NEWS_TOPICS = [
  { label: 'Top Stories', icon: Newspaper, color: '#FF3B30' },
  { label: 'Technology', icon: Cpu, color: '#3B82F6' },
  { label: 'AI & Tech', icon: Sparkles, color: '#A855F7' },
  { label: 'Business', icon: Briefcase, color: '#10B981' },
  { label: 'Science', icon: Globe, color: '#06B6D4' },
  { label: 'Sports', icon: Trophy, color: '#F59E0B' },
  { label: 'Gaming', icon: Gamepad2, color: '#EC4899' },
];

export function NewsPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [refreshing, setRefreshing] = useState(false);
  const [localArticles, setLocalArticles] = useState<Article[] | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>(data?.topic || 'Top Stories');

  useEffect(() => {
    if (data?.articles || data?.items) {
      setLocalArticles(data.articles || data.items);
    }
    if (data?.topic) {
      setActiveTopic(data.topic);
    }
  }, [data]);

  const articles: Article[] = localArticles || data?.articles || data?.items || [];

  const fetchTopicNews = async (topicToFetch: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTopic(topicToFetch);
    setRefreshing(true);
    try {
      const resStr = await window.electronAPI?.executeTool?.('get_news', { topic: topicToFetch }, {});
      if (resStr) {
        const parsed = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
        const list = parsed?.articles || parsed?.items;
        if (Array.isArray(list)) setLocalArticles(list);
      }
    } catch { /* ignore refresh error */ }
    setTimeout(() => setRefreshing(false), 600);
  };

  // Auto-load if empty
  useEffect(() => {
    if (articles.length === 0 && !refreshing) {
      fetchTopicNews(activeTopic);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTimeAgo = (article: Article) => {
    const raw = article.date || article.time;
    if (!raw) return 'Just now';
    if (raw.includes('ago') || raw === 'Recent') return raw;
    try {
      const ms = Date.now() - new Date(raw).getTime();
      if (isNaN(ms) || ms < 0) return 'Recent';
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return 'Recent'; }
  };

  const topicConfig = NEWS_TOPICS.find(t => t.label.toLowerCase() === activeTopic.toLowerCase()) || NEWS_TOPICS[0];
  const TopicIcon = topicConfig.icon;
  const accentColor = topicConfig.color;

  if (articles.length === 0) {
    return (
      <div style={{
        width: '100%', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1A1A1A', color: '#8A8A90',
        fontSize: 12, gap: 8
      }}>
        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Fetching Google News ({activeTopic})...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── COMPACT VIEW ───
  if (!expanded) {
    const topArticle = articles[0];
    const pub = topArticle.source || topArticle.publisher || 'Google News';
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(380); }}
        style={{
          width: '100%', height: 64,
          background: '#1A1A1A',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0, overflow: 'hidden'
        }}>
          {topArticle.faviconUrl ? (
            <img
              src={topArticle.faviconUrl}
              alt={pub}
              style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <TopicIcon size={18} color={accentColor} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topArticle.title}
          </div>
          <div style={{ fontSize: 10, color: '#8A8A90', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, color: accentColor }}>{pub}</span>
            <span>·</span>
            <span>{getTimeAgo(topArticle)}</span>
          </div>
        </div>

        <div style={{
          fontSize: 9, fontWeight: 700, color: accentColor, textTransform: 'uppercase',
          letterSpacing: '0.04em', flexShrink: 0, background: `${accentColor}20`,
          padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4
        }}>
          <span>{activeTopic}</span>
          <ChevronDown size={11} />
        </div>
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{
        width: '100%', minHeight: 340, maxHeight: defaultExpanded ? 460 : 380,
        overflowY: 'auto', overflowX: 'hidden',
        background: '#18181A',
        padding: '28px 20px 20px',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
      }}
    >
      {/* Collapse */}
      {!defaultExpanded && (
        <div
          onClick={() => { setExpanded(false); if (onExpand) onExpand(64); }}
          style={{
            position: 'absolute', top: 10, left: 18,
            cursor: 'pointer', opacity: 0.5,
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
        onClick={(e) => fetchTopicNews(activeTopic, e)}
        style={{ position: 'absolute', top: 10, right: 18, cursor: 'pointer', opacity: 0.6, zIndex: 2 }}
        title="Refresh news"
      >
        <RefreshCw size={13} color="#A0A0A5" />
      </motion.div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: `${accentColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TopicIcon size={15} color={accentColor} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{activeTopic}</div>
            <div style={{ fontSize: 10, color: '#6A6A70' }}>Google News Live Feed</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#8A8A90', fontWeight: 600 }}>{articles.length} stories</span>
      </div>

      {/* Topic Switcher Chips */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 10,
        scrollbarWidth: 'none', borderBottom: '1px solid #252528', flexShrink: 0
      }}>
        {NEWS_TOPICS.map(t => {
          const isSelected = t.label.toLowerCase() === activeTopic.toLowerCase();
          return (
            <button
              key={t.label}
              onClick={(e) => fetchTopicNews(t.label, e)}
              style={{
                background: isSelected ? t.color : '#222226',
                color: isSelected ? '#FFF' : '#A0A0A5',
                border: `1px solid ${isSelected ? t.color : '#2E2E34'}`,
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Articles List with Rich Visual Preview Cards & Smooth Hover */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {articles.map((article, i) => {
          const pub = article.source || article.publisher || 'Google News';
          return (
            <div
              key={i}
              onClick={() => window.electronAPI?.openExternal(article.link)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: '1px solid #28282D', background: '#1E1E22',
                cursor: 'pointer', transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#25252B';
                e.currentTarget.style.borderColor = `${accentColor}66`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#1E1E22';
                e.currentTarget.style.borderColor = '#28282D';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Visual Preview Thumbnail / Publisher Badge */}
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: `linear-gradient(135deg, ${accentColor}28 0%, #141417 100%)`,
                border: `1px solid ${accentColor}38`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', position: 'relative'
              }}>
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : article.faviconUrl ? (
                  <img
                    src={article.faviconUrl}
                    alt={pub}
                    style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <TopicIcon size={20} color={accentColor} />
                )}
              </div>

              {/* Text Content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB', lineHeight: 1.4 }}>
                  {article.title}
                </div>
                {article.snippet && article.snippet !== article.title && (
                  <div style={{
                    fontSize: 11, color: '#9A9AA2', lineHeight: 1.45,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {article.snippet}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#7A7A82' }}>
                    <span style={{
                      fontWeight: 600, color: accentColor, background: `${accentColor}18`,
                      padding: '2px 6px', borderRadius: 4
                    }}>{pub}</span>
                    <span>·</span>
                    <span>{getTimeAgo(article)}</span>
                  </div>
                  <ExternalLink size={11} color="#7A7A82" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const newsPillMeta = { name: 'News', height: 64, keywords: ['news', 'breaking', 'headlines', 'article', 'story', 'stories', 'tech news'] };
