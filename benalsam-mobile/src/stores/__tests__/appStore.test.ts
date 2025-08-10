import { renderHook, act } from "@testing-library/react-native";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(), 
  removeItem: jest.fn(),
}));

// Mock Supabase
jest.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

// Import after mocks
import { useAuthStore, User } from "../authStore";

describe("AuthStore Extended Tests", () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    jest.clearAllMocks();
  });

  describe("User Management", () => {
    it("handles user session correctly", () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
      };
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);
    });

    it("clears user session correctly", () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
      };
      
      act(() => {
        result.current.setUser(mockUser);
        result.current.setUser(null);
      });
      
      expect(result.current.user).toBeNull();
    });

    it("handles loading state during auth operations", () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.loading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Authentication Flow", () => {
    it("handles successful sign in", async () => {
      const { supabase } = require("../../services/supabaseClient");
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
      };
      
      // Mock successful sign in
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("handles sign in errors", async () => {
      const { supabase } = require("../../services/supabaseClient");
      const { result } = renderHook(() => useAuthStore());
      
      // Mock sign in error
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });
      
      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "wrong-password");
        } catch (error) {
          expect((error as Error).message).toBe("Invalid credentials");
        }
      });
      
      expect(result.current.user).toBeNull();
    });

    it("handles sign out correctly", async () => {
      const { supabase } = require("../../services/supabaseClient");
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser: User = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        created_at: "2024-01-01T00:00:00Z",
      };
      
      // Set user first
      act(() => {
        result.current.setUser(mockUser);
      });
      
      // Mock successful sign out
      supabase.auth.signOut.mockResolvedValue({ error: null });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(result.current.user).toBeNull();
    });
  });
});
