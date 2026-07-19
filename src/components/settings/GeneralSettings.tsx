import React from 'react';
import { s, Toggle } from './SettingsStyles';

export function GeneralSettings({
  userName, setUserName,
  userContext, setUserContext,
  favoritePlaylist, setFavoritePlaylist,
  autoStart, setAutoStart
}: any) {
  return (
    <div>
      <h3 style={s.sectionTitle}>Profile</h3>
      <p style={s.sectionDesc}>Tell Whispr about yourself so it can personalize responses.</p>
      <div style={s.field}>
        <label style={s.label}>Your Name</label>
        <input style={s.input} value={userName} onChange={e => { setUserName(e.target.value); localStorage.setItem('whispr_user_name', e.target.value); }} placeholder="e.g., Alex" />
      </div>
      <div style={s.field}>
        <label style={s.label}>Context / Instructions</label>
        <textarea
          style={{ ...s.input, height: 100, resize: 'vertical' }}
          value={userContext}
          onChange={e => { setUserContext(e.target.value); localStorage.setItem('whispr_user_context', e.target.value); }}
          placeholder="e.g., I'm a computer science student. I prefer concise answers. I use Windows 11."
        />
        <span style={s.hint}>This information is stored locally and prepended to every conversation.</span>
      </div>
      <div style={s.field}>
        <label style={s.label}>Favorite Spotify Playlist / Artist Link</label>
        <input 
          style={s.input} 
          value={favoritePlaylist} 
          onChange={e => {
            setFavoritePlaylist(e.target.value);
            localStorage.setItem('whispr_spotify_playlist', e.target.value);
          }} 
          placeholder="https://open.spotify.com/playlist/..." 
        />
        <span style={s.hint}>If you ask to "Play Spotify", it will blast this by default.</span>
      </div>
      <h3 style={s.sectionTitle}>System Integration</h3>
      <p style={s.sectionDesc}>Manage how Whispr interacts with your operating system.</p>
      <div style={s.field}>
        <Toggle 
          label="Launch Whispr on system startup" 
          value={autoStart} 
          onChange={(v) => { 
            setAutoStart(v); 
            localStorage.setItem('whispr_auto_start', v ? 'true' : 'false');
            if ((window as any).electronAPI?.setAutoStart) (window as any).electronAPI.setAutoStart(v); 
          }} 
        />
      </div>
    </div>
  );
}
