import { renderHook, act } from "@testing-library/react-native";
import { useAuthStore } from "../authStore";

// Mock supabase
jest.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      eq: jest.fn(),
    })),
  },
}));

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  username: "testuser",
  created_at: "2023-01-01T00:00:00Z",
};

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    jest.clearAllMocks();
  });

  it("has correct initial state", () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false); // Loading might be false due to persist middleware
    expect(result.current.initialized).toBe(false);
  });

  it("sets user correctly", () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
  });

  it("handles sign in", async () => {
    const { supabase } = require("../../services/supabaseClient");
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.signIn("test@example.com", "password");
    });
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
  });
});
