// ===== Sound Asset Imports =====
import bgmBattle from '../assets/sounds/bgm/battle.mp3';
import bgmMenu from '../assets/sounds/bgm/menu.mp3';
import bgmLevelSelect from '../assets/sounds/bgm/level-select.mp3';
import bgmEndless from '../assets/sounds/bgm/endless.mp3';

import sfxAttack from '../assets/sounds/sfx/attack.mp3';
import sfxPowerStrike from '../assets/sounds/sfx/power-strike.mp3';
import sfxSpell from '../assets/sounds/sfx/spell.mp3';
import sfxHeroHit from '../assets/sounds/sfx/hero-hit.mp3';
import sfxEnemyHit from '../assets/sounds/sfx/enemy-hit.mp3';
import sfxParry from '../assets/sounds/sfx/parry.mp3';
import sfxDodge from '../assets/sounds/sfx/dodge.mp3';
import sfxHeal from '../assets/sounds/sfx/heal.mp3';
import sfxBerserk from '../assets/sounds/sfx/berserk.mp3';
import sfxPotion from '../assets/sounds/sfx/potion.mp3';
import sfxAntidote from '../assets/sounds/sfx/antidote.mp3';
import sfxBurn from '../assets/sounds/sfx/burn.mp3';
import sfxFreeze from '../assets/sounds/sfx/freeze.mp3';
import sfxPoison from '../assets/sounds/sfx/poison.mp3';
import sfxVictory from '../assets/sounds/sfx/victory.mp3';
import sfxDefeat from '../assets/sounds/sfx/defeat.mp3';
import sfxLevelUp from '../assets/sounds/sfx/level-up.mp3';
import sfxClick from '../assets/sounds/sfx/click.mp3';
import sfxConnect from '../assets/sounds/sfx/connect.mp3';
import sfxBuy from '../assets/sounds/sfx/buy.mp3';
import sfxEquip from '../assets/sounds/sfx/equip.mp3';

import voiceMageAttack from '../assets/sounds/voice/mage/attack.mp3';
import voiceMageHit from '../assets/sounds/voice/mage/hit.mp3';
import voiceMageDeath from '../assets/sounds/voice/mage/death.mp3';
import voiceWarriorAttack from '../assets/sounds/voice/warrior/attack.mp3';
import voiceWarriorHit from '../assets/sounds/voice/warrior/hit.mp3';
import voiceWarriorDeath from '../assets/sounds/voice/warrior/death.mp3';

// ===== Types =====
export type BGMKey = 'battle' | 'menu' | 'level-select' | 'endless';
export type SFXKey =
  | 'attack' | 'power-strike' | 'spell' | 'hero-hit' | 'enemy-hit'
  | 'parry' | 'dodge' | 'heal' | 'berserk' | 'potion' | 'antidote'
  | 'burn' | 'freeze' | 'poison' | 'victory' | 'defeat' | 'level-up'
  | 'click' | 'connect' | 'buy' | 'equip';
export type VoiceKey = 'mage-attack' | 'mage-hit' | 'mage-death' | 'warrior-attack' | 'warrior-hit' | 'warrior-death';

const BGM_MAP: Record<BGMKey, string> = {
  battle: bgmBattle,
  menu: bgmMenu,
  'level-select': bgmLevelSelect,
  endless: bgmEndless,
};

const SFX_MAP: Record<SFXKey, string> = {
  attack: sfxAttack,
  'power-strike': sfxPowerStrike,
  spell: sfxSpell,
  'hero-hit': sfxHeroHit,
  'enemy-hit': sfxEnemyHit,
  parry: sfxParry,
  dodge: sfxDodge,
  heal: sfxHeal,
  berserk: sfxBerserk,
  potion: sfxPotion,
  antidote: sfxAntidote,
  burn: sfxBurn,
  freeze: sfxFreeze,
  poison: sfxPoison,
  victory: sfxVictory,
  defeat: sfxDefeat,
  'level-up': sfxLevelUp,
  click: sfxClick,
  connect: sfxConnect,
  buy: sfxBuy,
  equip: sfxEquip,
};

const VOICE_MAP: Record<VoiceKey, string> = {
  'mage-attack': voiceMageAttack,
  'mage-hit': voiceMageHit,
  'mage-death': voiceMageDeath,
  'warrior-attack': voiceWarriorAttack,
  'warrior-hit': voiceWarriorHit,
  'warrior-death': voiceWarriorDeath,
};

// ===== SoundManager Singleton =====
class SoundManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBGMKey: BGMKey | null = null;
  private sfxVolume = 0.55;
  private bgmVolume = 0.3;
  private muted = false;
  private voiceVolume = 0.7;

  constructor() {
    const saved = localStorage.getItem('ff_sound');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.sfxVolume = parsed.sfxVolume ?? this.sfxVolume;
        this.bgmVolume = parsed.bgmVolume ?? this.bgmVolume;
        this.muted = parsed.muted ?? this.muted;
        this.voiceVolume = parsed.voiceVolume ?? this.voiceVolume;
      } catch { /* ignore */ }
    }
  }

  private savePrefs() {
    localStorage.setItem('ff_sound', JSON.stringify({
      sfxVolume: this.sfxVolume,
      bgmVolume: this.bgmVolume,
      voiceVolume: this.voiceVolume,
      muted: this.muted,
    }));
  }

  playBGM(key: BGMKey) {
    if (this.currentBGMKey === key && this.bgmAudio && !this.bgmAudio.paused) return;
    this.stopBGM();
    if (this.muted) return;
    const audio = new Audio(BGM_MAP[key]);
    audio.loop = true;
    audio.volume = this.bgmVolume;
    audio.play().catch(() => {});
    this.bgmAudio = audio;
    this.currentBGMKey = key;
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
    this.currentBGMKey = null;
  }

  playSFX(key: SFXKey) {
    if (this.muted) return;
    const src = SFX_MAP[key];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = this.sfxVolume;
    audio.play().catch(() => {});
  }

  playVoice(key: VoiceKey) {
    if (this.muted) return;
    const src = VOICE_MAP[key];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = this.voiceVolume;
    audio.play().catch(() => {});
  }

  // Detect and play SFX from battle log entry
  playFromLog(action: string, actor: 'hero' | 'enemy') {
    if (this.muted) return;
    const l = action.toLowerCase();

    if (l.includes('parried') || l.includes('parries')) { this.playSFX('parry'); return; }

    if (actor === 'hero') {
      if (l.includes('hero attacks'))        { this.playSFX('attack'); return; }
      if (l.includes('power strike'))        { this.playSFX('power-strike'); return; }
      if (l.includes('hero casts spell'))    { this.playSFX('spell'); return; }
      if (l.includes('hero heals'))          { this.playSFX('heal'); return; }
      if (l.includes('evade'))               { this.playSFX('dodge'); return; }
      if (l.includes('berserk'))             { this.playSFX('berserk'); return; }
      if (l.includes('🧪') || l.includes('potion')) { this.playSFX('potion'); return; }
      if (l.includes('💊') || l.includes('antidote')) { this.playSFX('antidote'); return; }
      if (l.includes('burn') || l.includes('🔥'))   { this.playSFX('burn'); return; }
      if (l.includes('frozen') || l.includes('❄️'))  { this.playSFX('freeze'); return; }
      if (l.includes('poisoned') || l.includes('🟣')) { this.playSFX('poison'); return; }
      if (l.includes('enemy -'))             { this.playSFX('enemy-hit'); return; }
    }

    if (actor === 'enemy') {
      if (l.includes('hero -'))              { this.playSFX('hero-hit'); return; }
      if (l.includes('enemy casts spell') || l.includes('✨ enemy')) { this.playSFX('spell'); return; }
      if (l.includes('power strike'))        { this.playSFX('power-strike'); return; }
      if (l.includes('burn strike') || l.includes('🔥')) { this.playSFX('burn'); return; }
      if (l.includes('freeze strike') || l.includes('❄️')) { this.playSFX('freeze'); return; }
      if (l.includes('poison strike') || l.includes('🟣')) { this.playSFX('poison'); return; }
    }
  }

  playVoiceForAction(action: string, actor: 'hero' | 'enemy', characterClass: string) {
    if (this.muted) return;
    // Only play voice for hero actions ~40% of time to avoid spam
    if (actor !== 'hero' || Math.random() > 0.4) return;
    const l = action.toLowerCase();
    const isMage = characterClass === 'mage';
    const prefix: 'mage' | 'warrior' = isMage ? 'mage' : 'warrior';
    if (l.includes('attacks') || l.includes('power strike') || l.includes('casts spell')) {
      this.playVoice(`${prefix}-attack`);
    } else if (l.includes('hero -') || l.includes('hero heals')) {
      this.playVoice(`${prefix}-hit`);
    }
  }

  setMuted(val: boolean) {
    this.muted = val;
    if (val) this.stopBGM();
    this.savePrefs();
  }

  setSFXVolume(v: number) { this.sfxVolume = Math.max(0, Math.min(1, v)); this.savePrefs(); }
  setBGMVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgmAudio) this.bgmAudio.volume = this.bgmVolume;
    this.savePrefs();
  }
  setVoiceVolume(v: number) { this.voiceVolume = Math.max(0, Math.min(1, v)); this.savePrefs(); }

  isMuted() { return this.muted; }
  getSFXVolume() { return this.sfxVolume; }
  getBGMVolume() { return this.bgmVolume; }
  getVoiceVolume() { return this.voiceVolume; }
}

export const soundManager = new SoundManager();
