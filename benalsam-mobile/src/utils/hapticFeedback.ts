import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

class HapticFeedback {
  private isEnabled: boolean = true;

  /**
   * Haptic feedback'i etkinleştir/devre dışı bırak
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Haptic feedback'in etkin olup olmadığını kontrol et
   */
  isHapticEnabled(): boolean {
    return this.isEnabled && Platform.OS === 'ios';
  }

  /**
   * Light haptic feedback
   */
  light() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Medium haptic feedback
   */
  medium() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Heavy haptic feedback
   */
  heavy() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Success haptic feedback
   */
  success() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Warning haptic feedback
   */
  warning() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Error haptic feedback
   */
  error() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Selection haptic feedback
   */
  selection() {
    if (!this.isHapticEnabled()) return;
    
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  /**
   * Generic haptic feedback - type parametresi ile
   */
  trigger(type: HapticType) {
    switch (type) {
      case 'light':
        this.light();
        break;
      case 'medium':
        this.medium();
        break;
      case 'heavy':
        this.heavy();
        break;
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
      case 'selection':
        this.selection();
        break;
      default:
        this.light();
    }
  }
}

// Singleton instance
export const hapticFeedback = new HapticFeedback();

// Convenience functions
export const haptic = {
  light: () => hapticFeedback.light(),
  medium: () => hapticFeedback.medium(),
  heavy: () => hapticFeedback.heavy(),
  success: () => hapticFeedback.success(),
  warning: () => hapticFeedback.warning(),
  error: () => hapticFeedback.error(),
  selection: () => hapticFeedback.selection(),
  trigger: (type: HapticType) => hapticFeedback.trigger(type),
  setEnabled: (enabled: boolean) => hapticFeedback.setEnabled(enabled),
  isEnabled: () => hapticFeedback.isHapticEnabled(),
};

export default hapticFeedback; 