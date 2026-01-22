import React, { useEffect, useRef } from 'react';
import './GroupMeetPreview.css';

export default function GroupMeetPreview({ meeting, group, onClose, currentUser, userData }) {
  if (!meeting) return null;
  const { meetingUrl } = meeting;
  const iframeRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const jitsiContainerRef = useRef(null);

  // cleanup iframe on unmount to stop media
  useEffect(() => {
    let mounted = true;
    async function initJitsi() {
      try {
        const domain = new URL(meetingUrl).hostname;
        const room = new URL(meetingUrl).pathname.replace(/^\//, '');
        // load external api if not present
        if (!window.JitsiMeetExternalAPI) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://meet.jit.si/external_api.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
          });
        }

        if (!mounted) return;
        const displayName = (currentUser && (currentUser.displayName || currentUser.email)) || 'Guest';
        const email = (currentUser && currentUser.email) || '';
        const isMentor = (userData && (userData.userRole === 'Mentor' || userData.role === 'mentor')) || (currentUser && (currentUser.role === 'mentor' || currentUser.isMentor));

        // Log mount for debugging role parity
        console.log('GroupMeetPreview mount — isMentor:', !!isMentor, 'room:', room);

        // Role-based config: mentors get moderator-like toolbar and options; students get participant defaults
        const baseConfig = {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          // keep conference starting behavior flexible
          requireModeratorToStart: false,
        };

        const mentorInterface = {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'recording', 'etherpad',
            'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'invite', 'participantlist', 'mute-everyone', 'kick-out', 'security'
          ]
        };

        const studentInterface = {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
        };

        const options = {
          roomName: room,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName, email },
          configOverwrite: { ...(baseConfig), ...(isMentor ? { enableLobby: false } : {}) },
          interfaceConfigOverwrite: isMentor ? mentorInterface : studentInterface,
        };

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      } catch (e) {
        // fallback: keep iframe
        console.warn('Jitsi external API failed, falling back to iframe', e);
      }
    }

    initJitsi();

    return () => {
      mounted = false;
      try {
        if (jitsiApiRef.current && typeof jitsiApiRef.current.dispose === 'function') {
          jitsiApiRef.current.dispose();
        }
      } catch (e) {}
      try {
        if (iframeRef.current) iframeRef.current.src = 'about:blank';
      } catch (e) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gm-backdrop" role="presentation">
      <div className="gm-modal gm-modal-enter" role="dialog" aria-modal="true">
        <div className="gm-header">
          <div className="gm-title"><strong>{group?.name || 'Live Preview'}</strong></div>
          <button className="gm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="gm-split">
          <div className="gm-left">
            <div className="gm-join-panel">
              <div className="gm-join-label">Join meeting</div>
              <div className="gm-join-desc">Embedded preview shown on the right — you can join here or open in a new tab.</div>
              <a className="gm-join btn-create-primary" href={meetingUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
            </div>
          </div>
          <div className="gm-right">
            <div className="gm-embed-wrapper">
                <iframe
                  ref={iframeRef}
                  title="Live preview"
                  src={(() => {
                    try {
                        const displayName = (currentUser && (currentUser.displayName || currentUser.email)) || 'Guest';
                        const email = (currentUser && currentUser.email) || '';
                        const isMentor = (userData && (userData.userRole === 'Mentor' || userData.role === 'mentor')) || (currentUser && (currentUser.role === 'mentor' || currentUser.isMentor));
                        const hashParams = [];
                        hashParams.push(`userInfo.displayName="${encodeURIComponent(displayName)}"`);
                        if (email) hashParams.push(`userInfo.email="${encodeURIComponent(email)}"`);
                        hashParams.push('config.prejoinPageEnabled=false');
                        hashParams.push('config.startWithAudioMuted=false');
                        hashParams.push('config.startWithVideoMuted=false');
                        hashParams.push('config.requireModeratorToStart=false');
                        hashParams.push('config.enableWelcomePage=false');
                        if (isMentor) {
                          // hint for UI; actual moderator rights depend on Jitsi deployment
                          hashParams.push('config.enableLobby=false');
                        }
                        return `${meetingUrl}#${hashParams.join('&')}`;
                    } catch (e) {
                      return meetingUrl;
                    }
                  })()}
                  allow="camera; microphone; fullscreen"
                  className="gm-iframe"
                />
            </div>
          </div>
        </div>

        <div className="gm-footer">
          <div className="gm-host">{group?.name} — Hosted by Group</div>
          <a className="gm-join btn-create-primary" href={meetingUrl} target="_blank" rel="noopener noreferrer">Join in new tab</a>
        </div>
      </div>
    </div>
  );
}