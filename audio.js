class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicSource = null;
        this.musicStartTime = 0;
        this.musicPauseTime = 0;
        this.isPlaying = false;
        this.enabled = true;
        
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.4;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }
    
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }
    
    createOscillator(freq, type = 'square') {
        if (!this.audioContext) return null;
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        return osc;
    }
    
    playNote(frequency, duration, type = 'square', gainNode = null) {
        if (!this.enabled || !this.audioContext) return;
        
        this.resumeAudioContext();
        
        const osc = this.createOscillator(frequency, type);
        const gain = this.audioContext.createGain();
        const target = gainNode || this.sfxGain;
        
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(target);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    playChord(frequencies, duration, type = 'square') {
        frequencies.forEach(freq => {
            this.playNote(freq, duration, type);
        });
    }
    
    playButtonClick() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        const osc = this.createOscillator(800, 'square');
        const gain = this.audioContext.createGain();
        
        gain.gain.value = 0.2;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }
    
    playWinSound() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const duration = 0.15;
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, duration, 'square');
            }, i * 100);
        });
        
        setTimeout(() => {
            this.playChord([1046.50, 1318.51, 1567.98], 0.5, 'square');
        }, 400);
    }
    
    playLoseSound() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        const notes = [523.25, 493.88, 466.16, 392.00];
        const duration = 0.2;
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, duration, 'triangle');
            }, i * 120);
        });
    }
    
    playDrawSound() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        this.playChord([440, 554.37], 0.3, 'square');
    }
    
    playCountdownTick() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        this.playNote(880, 0.1, 'square');
    }
    
    playRevealSound() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeAudioContext();
        
        this.playNote(1046.50, 0.15, 'square');
        setTimeout(() => {
            this.playNote(1318.51, 0.2, 'square');
        }, 100);
    }
    
    playThemeMusic() {
        if (!this.enabled || !this.audioContext || this.isPlaying) return;
        
        this.resumeAudioContext();
        this.isPlaying = true;
        
        const melody = [
            // Energetic 8-bit melody
            {freq: 523.25, duration: 0.15}, // C5
            {freq: 659.25, duration: 0.15}, // E5
            {freq: 783.99, duration: 0.15}, // G5
            {freq: 659.25, duration: 0.15}, // E5
            {freq: 523.25, duration: 0.15}, // C5
            {freq: 587.33, duration: 0.15}, // D5
            {freq: 659.25, duration: 0.3},  // E5
            
            {freq: 493.88, duration: 0.15}, // B4
            {freq: 587.33, duration: 0.15}, // D5
            {freq: 659.25, duration: 0.15}, // E5
            {freq: 587.33, duration: 0.15}, // D5
            {freq: 493.88, duration: 0.15}, // B4
            {freq: 523.25, duration: 0.15}, // C5
            {freq: 587.33, duration: 0.3},  // D5
            
            {freq: 392.00, duration: 0.15}, // G4
            {freq: 493.88, duration: 0.15}, // B4
            {freq: 587.33, duration: 0.15}, // D5
            {freq: 493.88, duration: 0.15}, // B4
            {freq: 392.00, duration: 0.15}, // G4
            {freq: 440.00, duration: 0.15}, // A4
            {freq: 493.88, duration: 0.3},  // B4
            
            {freq: 523.25, duration: 0.15}, // C5
            {freq: 659.25, duration: 0.15}, // E5
            {freq: 783.99, duration: 0.15}, // G5
            {freq: 1046.50, duration: 0.45} // C6
        ];
        
        const bass = [
            {freq: 130.81, duration: 0.3},  // C3
            {freq: 164.81, duration: 0.3},  // E3
            {freq: 196.00, duration: 0.3},  // G3
            {freq: 164.81, duration: 0.3},  // E3
            
            {freq: 123.47, duration: 0.3},  // B2
            {freq: 146.83, duration: 0.3},  // D3
            {freq: 164.81, duration: 0.3},  // E3
            {freq: 146.83, duration: 0.3},  // D3
            
            {freq: 98.00, duration: 0.3},   // G2
            {freq: 123.47, duration: 0.3},  // B2
            {freq: 146.83, duration: 0.3},  // D3
            {freq: 123.47, duration: 0.3},  // B2
            
            {freq: 130.81, duration: 0.3},  // C3
            {freq: 164.81, duration: 0.3},  // E3
            {freq: 196.00, duration: 0.3},  // G3
            {freq: 130.81, duration: 0.45}  // C3
        ];
        
        const playMusicLoop = () => {
            if (!this.isPlaying || !this.enabled) return;
            
            let melodyTime = 0;
            let bassTime = 0;
            
            melody.forEach(note => {
                setTimeout(() => {
                    if (this.isPlaying && this.enabled) {
                        this.playNote(note.freq, note.duration, 'square', this.musicGain);
                    }
                }, melodyTime * 1000);
                melodyTime += note.duration;
            });
            
            bass.forEach(note => {
                setTimeout(() => {
                    if (this.isPlaying && this.enabled) {
                        this.playNote(note.freq, note.duration, 'triangle', this.musicGain);
                    }
                }, bassTime * 1000);
                bassTime += note.duration;
            });
            
            const loopDuration = Math.max(melodyTime, bassTime);
            setTimeout(() => {
                if (this.isPlaying && this.enabled) {
                    playMusicLoop();
                }
            }, loopDuration * 1000);
        };
        
        playMusicLoop();
    }
    
    stopMusic() {
        this.isPlaying = false;
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.musicSource = null;
        }
    }
}

const audioManager = new AudioManager();
