import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class AudioManager {
  public async playClick() {
    if (Platform.OS === 'web') return;
    // Audio trigger hook
  }

  public async playSuccess() {
    if (Platform.OS === 'web') return;
    // Success audio hook
  }
}

export const audio = new AudioManager();
