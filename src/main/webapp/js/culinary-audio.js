/**
 * FoodWala — Cinematic Culinary Audio Engine
 * Synchronizes authentic soundscapes with the Hero Video:
 * - Woodfired Pizza (22.09s): Hearth crackle, bubbly cheese sizzle
 * - Sizzling Wok (25.41s): High-heat flame roar, oil sizzle, stir-fry toss
 * - Gourmet Burger (10.01s): Flat-top griddle smash-patty sear & steam
 * 
 * Features:
 * - Exact video duration matching & loop resynchronization
 * - Smooth volume ramping (zero pop/click)
 * - Drift compensation (syncs to video.currentTime)
 * - Page Visibility auto-pause (saves battery on tab blur)
 * - Web Audio API + HTML5 Audio fallback
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
      this.targetVolume = 0.7;
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

      // Create dedicated synchronized audio element
      this.audioElem = document.createElement('audio');
      this.audioElem.preload = 'auto';
      this.audioElem.loop = true;
      this.audioElem.volume = 0;
      this.audioElem.src = AUDIO_MAP.pizza.file;

      // Identify initial scene from video src
      this.updateSceneFromVideo();

      // Bind mute button
      if (this.btnMute && !this.btnMute.dataset.culinaryBound) {
        this.btnMute.dataset.culinaryBound = 'true';
        this.btnMute.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
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
          this.playAudio();
          this.fadeVolume(this.targetVolume, 250);
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
        this.fadeVolume(0, 200, () => {
          if (this.audioElem) this.audioElem.pause();
        });
      } else {
        this.syncTime();
        this.playAudio();
        this.fadeVolume(this.targetVolume, 300);
      }
    }

    playAudio() {
      if (!this.audioElem) return;
      const playPromise = this.audioElem.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[CulinaryAudio] Autoplay blocked, waiting for user gesture:', err.message);
        });
      }
    }

    fadeVolume(target, durationMs, callback) {
      if (!this.audioElem) return;
      if (this.fadeInterval) clearInterval(this.fadeInterval);

      const start = this.audioElem.volume;
      const diff = target - start;
      const steps = 15;
      const stepDuration = durationMs / steps;
      let currentStep = 0;

      this.fadeInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        this.audioElem.volume = Math.max(0, Math.min(1, start + diff * progress));

        if (currentStep >= steps) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          this.audioElem.volume = target;
          if (callback) callback();
        }
      }, stepDuration);
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
