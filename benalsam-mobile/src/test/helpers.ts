import { render as rtlRender, RenderOptions } from "@testing-library/react-native";
import React, { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  withSafeArea?: boolean;
}

export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { withSafeArea = true, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (withSafeArea) {
      return React.createElement(SafeAreaProvider, {
        initialMetrics: {
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }
      }, children);
    }
    return React.createElement(React.Fragment, null, children);
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock navigation functions
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
};

// Common test data
export const testUser = {
  id: "test-user-id",
  email: "test@example.com",
  username: "testuser",
  created_at: "2023-01-01T00:00:00Z",
};

// Re-export everything from testing library
export * from "@testing-library/react-native";
