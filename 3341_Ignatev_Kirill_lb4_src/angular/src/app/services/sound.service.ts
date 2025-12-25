import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Инициализация AudioContext для генерации звуков
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Воспроизвести звук при получении нового сообщения
   */
  playMessageSound(): void {
    this.playTone(800, 0.1, 'sine');
  }

  /**
   * Воспроизвести звук при появлении новости
   */
  playNewsSound(): void {
    this.playTone(600, 0.15, 'sine');
    setTimeout(() => {
      this.playTone(700, 0.15, 'sine');
    }, 100);
  }

  /**
   * Воспроизвести тон
   */
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

