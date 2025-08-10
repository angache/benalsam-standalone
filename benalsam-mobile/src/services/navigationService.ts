import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

class NavigationServiceClass {
  private navigator?: NavigationContainerRef<RootStackParamList>;

  setTopLevelNavigator(navigatorRef: NavigationContainerRef<RootStackParamList>) {
    this.navigator = navigatorRef;
    console.log('✅ NavigationService: Navigator ready');
  }

  isReady(): boolean {
    return !!this.navigator;
  }

  navigate(routeName: keyof RootStackParamList, params?: any) {
    if (this.navigator) {
      console.log('🧭 NavigationService: Navigating to', routeName, params);
      this.navigator.navigate(routeName as never, params);
    } else {
      console.warn('NavigationService: Navigator not set');
    }
  }

  goBack() {
    if (this.navigator) {
      this.navigator.goBack();
    }
  }

  reset(routeName: keyof RootStackParamList, params?: any) {
    if (this.navigator) {
      this.navigator.reset({
        index: 0,
        routes: [{ name: routeName as never, params }],
      });
    }
  }
}

export const NavigationService = new NavigationServiceClass();