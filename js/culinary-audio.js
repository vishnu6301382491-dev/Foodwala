/**
 * FoodWala — Cinematic Culinary Audio Engine
 * Synchronizes authentic soundscapes with the Hero Video:
 * - Woodfired Pizza (22.09s): Hearth crackle, bubbly cheese sizzle
 * - Sizzling Wok (25.41s): High-heat flame roar, oil sizzle, stir-fry toss
 * - Gourmet Burger (10.01s): Flat-top griddle smash-patty sear & steam
 */
(function (window) {
  'use strict';

  const AUDIO_MAP = {
    pizza: {
      file: './audio/pizza-sound.wav',
      duration: 22.09,
      label: 'Woodfired Pizza Sizzle'
    },
    wok: {
      file: './audio/wok-sound.wav',
      duration: 25.41,
      label: 'Sizzling Wok Stir-Fry'
    },
    burger: {
      file: './audio/burger-sound.wav',
      duration: 10.01,
      label: 'Grill Patty Sear'
    }
  };

  class CulinaryAudioEngine {
    constructor() {
      this.videoElem = null;
      this.btnMute = null;
      this.btnPlay = null;
      this.iconMute = null;
      this.textMute = null;
      this.audioElem = null;
      this.currentScene = 'pizza';
      this.isMuted = true;
      this.targetVolume = 0.8;
      this.initialized = false;
      this.fadeInterval = null;
    }

    init() {
      if (this.initialized) return;

      this.videoElem = document.getElementById('hero-food-video');
      this.btnMute = document.getElementById('btn-hero-video-mute');
      this.btnPlay = document.getElementById('btn-hero-video-play');
      this.iconMute = document.getElementById('hero-video-mute-icon');
      this.textMute = document.getElementById('hero-video-mute-text');

      if (!this.videoElem) return;

      // Create dedicated synchronized audio element & append to DOM
      this.audioElem = document.createElement('audio');
      this.audioElem.id = 'fw-culinary-audio-player';
      this.audioElem.preload = 'auto';
      this.audioElem.loop = true;
      this.audioElem.volume = 0;
      this.audioElem.style.display = 'none';
      this.audioElem.src = AUDIO_MAP.pizza.file;

      if (document.body) {
        document.body.appendChild(this.audioElem);
      }

      // Identify initial scene from video src
      this.updateSceneFromVideo();

      // Bind mute button once with stopImmediatePropagation
      if (this.btnMute && !this.btnMute.dataset.culinaryBound) {
        this.btnMute.dataset.culinaryBound = 'true';
        this.btnMute.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          this.toggleMute();
        });
      }

      // Sync with video play / pause / seek
      this.videoElem.addEventListener('play', () => {
        if (!this.isMuted) {
          this.playAudio();
        }
      });

      this.videoElem.addEventListener('pause', () => {
        if (this.audioElem) {
          this.audioElem.pause();
        }
      });

      this.videoElem.addEventListener('seeked', () => {
        this.syncTime();
      });

      this.videoElem.addEventListener('timeupdate', () => {
        // Drift compensation if desynced by > 0.3s
        if (!this.isMuted && this.audioElem && !this.audioElem.paused && !this.videoElem.paused) {
          const dur = AUDIO_MAP[this.currentScene].duration;
          const targetTime = (this.videoElem.currentTime || 0) % dur;
          const diff = Math.abs(this.audioElem.currentTime - targetTime);
          if (diff > 0.3) {
            this.syncTime();
          }
        }
      });

      // Scene Switcher Hook (for Pizza HD, Wok HD, Burger 4K buttons)
      const switcherBtns = document.querySelectorAll('.hero-video-switcher-btn');
      switcherBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          setTimeout(() => {
            this.updateSceneFromVideo();
          }, 80);
        });
      });

      // Page Visibility Auto-Pause (stops background sound on tab blur)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.audioElem && !this.audioElem.paused) {
            this.audioElem.pause();
          }
        } else {
          if (!this.isMuted && this.videoElem && !this.videoElem.paused) {
            this.playAudio();
          }
        }
      });

      this.initialized = true;
      this.updateUI();
      console.log('✅ [CulinaryAudio] Engine initialized for FoodWala.');
    }

    updateSceneFromVideo() {
      if (!this.videoElem || !this.audioElem) return;
      const currentSrc = this.videoElem.currentSrc || this.videoElem.src || '';

      let scene = 'pizza';
      if (currentSrc.includes('wok')) {
        scene = 'wok';
      } else if (currentSrc.includes('burger')) {
        scene = 'burger';
      } else {
        scene = 'pizza';
      }

      const cleanFileName = AUDIO_MAP[scene].file.replace('./audio/', '');
      if (scene !== this.currentScene || !this.audioElem.src.includes(cleanFileName)) {
        this.currentScene = scene;
        const wasPlaying = !this.isMuted && !this.videoElem.paused;
        this.audioElem.src = AUDIO_MAP[scene].file;
        this.syncTime();
        if (wasPlaying) {
          this.audioElem.volume = this.targetVolume;
          this.playAudio();
        }
        console.log(`[CulinaryAudio] Switched scene to: ${AUDIO_MAP[scene].label} (${AUDIO_MAP[scene].duration}s)`);
      }
    }

    syncTime() {
      if (this.videoElem && this.audioElem) {
        const vTime = this.videoElem.currentTime || 0;
        const dur = AUDIO_MAP[this.currentScene].duration;
        this.audioElem.currentTime = vTime % dur;
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.updateUI();

      if (this.isMuted) {
        console.log('🔇 [CulinaryAudio] Sound Muted');
        if (this.audioElem) {
          this.audioElem.volume = 0;
          this.audioElem.pause();
        }
      } else {
        console.log('🔊 [CulinaryAudio] Sound Unmuted: ' + AUDIO_MAP[this.currentScene].label);
        this.syncTime();
        if (this.audioElem) {
          this.audioElem.volume = this.targetVolume;
        }
        this.playAudio();
      }
    }

    fadeVolume(targetVol, duration = 300) {
      if (!this.audioElem) return;
      const startVol = this.audioElem.volume;
      const diff = targetVol - startVol;
      const steps = 10;
      const stepTime = duration / steps;
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (this.audioElem) {
          this.audioElem.volume = Math.max(0, Math.min(1, startVol + (diff * (currentStep / steps))));
        }
        if (currentStep >= steps) {
          clearInterval(timer);
          if (this.audioElem) this.audioElem.volume = targetVol;
        }
      }, stepTime);
    }

    playAudio() {
      if (!this.audioElem) return;
      const playPromise = this.audioElem.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🎵 [CulinaryAudio] Audio playing successfully at volume ' + this.audioElem.volume);
        }).catch((err) => {
          console.warn('[CulinaryAudio] Audio playback waiting for user interaction:', err.message);
        });
      }
    }

    updateUI() {
      this.iconMute = this.iconMute || document.getElementById('hero-video-mute-icon');
      this.textMute = this.textMute || document.getElementById('hero-video-mute-text');
      this.btnMute = this.btnMute || document.getElementById('btn-hero-video-mute');

      if (this.isMuted) {
        if (this.iconMute) this.iconMute.className = 'bi bi-volume-mute-fill';
        if (this.textMute) this.textMute.textContent = 'Muted';
        if (this.btnMute) {
          this.btnMute.classList.remove('btn-sound-active');
          this.btnMute.title = 'Click to Unmute Culinary Sound';
        }
      } else {
        if (this.iconMute) this.iconMute.className = 'bi bi-volume-up-fill';
        if (this.textMute) this.textMute.textContent = 'Sound On';
        if (this.btnMute) {
          this.btnMute.classList.add('btn-sound-active');
          this.btnMute.title = 'Click to Mute Culinary Sound';
        }
      }
    }
  }

  window.CulinaryAudio = new CulinaryAudioEngine();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CulinaryAudio.init());
  } else {
    window.CulinaryAudio.init();
  }

})(typeof window !== 'undefined' ? window : this);
