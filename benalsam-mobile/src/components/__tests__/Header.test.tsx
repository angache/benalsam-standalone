import React from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "../Header";

jest.mock("../../stores", () => ({
  useThemeColors: () => ({
    primary: "#007AFF",
    surface: "#F8F9FA", 
    border: "#E5E7EB",
    textSecondary: "#6B7280",
    white: "#FFFFFF",
    error: "#EF4444",
    black: "#000000",
  }),
}));

const renderWithSafeArea = (component: React.ReactElement) => {
  return render(<SafeAreaProvider>{component}</SafeAreaProvider>);
};

describe("Header", () => {
  it("renders header correctly", () => {
    const { toJSON } = renderWithSafeArea(<Header />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with theme toggle prop", () => {
    const mockThemeToggle = jest.fn();
    const { toJSON } = renderWithSafeArea(
      <Header onThemeToggle={mockThemeToggle} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with notification count", () => {
    const { toJSON } = renderWithSafeArea(
      <Header unreadNotificationCount={5} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders in dark mode", () => {
    const { toJSON } = renderWithSafeArea(
      <Header isDarkMode={true} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with all props", () => {
    const { toJSON } = renderWithSafeArea(
      <Header 
        onThemeToggle={jest.fn()}
        onSearchPress={jest.fn()}
        onNotificationPress={jest.fn()}
        onCreatePress={jest.fn()}
        onMenuPress={jest.fn()}
        isDarkMode={false}
        unreadNotificationCount={3}
      />
    );
    expect(toJSON()).toBeTruthy();
  });
});
