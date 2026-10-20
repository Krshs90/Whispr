import { s, Toggle } from './SettingsStyles';
import { Dropdown } from './AITab';

const MUSIC_PLATFORM_OPTIONS = [
  { value: 'spotify', label: 'Spotify (Desktop App)' },
  { value: 'youtube_music', label: 'YouTube Music' },
  { value: 'apple_music', label: 'Apple Music' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'spotify_web', label: 'Spotify (Web Player)' },
];

export function GeneralSettings({
  userName, setUserName,
  userContext, setUserContext,
  musicPlatform, setMusicPlatform,
  favoritePlaylist, setFavoritePlaylist,
  autoStart, setAutoStart
}: any) {
  return (
    <div>
      <h3 style={s.sectionTitle}>Profile</h3>
      <p style={s.sectionDesc}>Tell Whispr about yourself and your preferred apps so it can personalize actions.</p>
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
        <label style={s.label}>Preferred Music App</label>
        <Dropdown
          value={musicPlatform || 'spotify'}
          options={MUSIC_PLATFORM_OPTIONS}
          onChange={(val: string) => {
            setMusicPlatform(val);
            localStorage.setItem('whispr_music_platform', val);
          }}
        />
        <span style={s.hint}>When you ask Whispr to "Play [song or artist]", it will automatically launch and play on this platform.</span>
      </div>
      <div style={s.field}>
        <label style={s.label}>Default Music Playlist / Station Link (Optional)</label>
        <input 
          style={s.input} 
          value={favoritePlaylist} 
          onChange={e => {
            setFavoritePlaylist(e.target.value);
            localStorage.setItem('whispr_spotify_playlist', e.target.value);
          }} 
          placeholder="https://open.spotify.com/playlist/... or https://music.youtube.com/playlist?list=..." 
        />
        <span style={s.hint}>If you ask to "Play music" without a specific song name, Whispr will open this link.</span>
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
