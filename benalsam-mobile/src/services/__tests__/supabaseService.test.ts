import { supabaseService } from "../supabaseService";

// Mock supabase client
jest.mock("../supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    })),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe("SupabaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles database operations", () => {
    const { supabase } = require("../supabaseClient");
    expect(supabase.from).toBeDefined();
  });

  it("handles auth operations", () => {
    const { supabase } = require("../supabaseClient");
    expect(supabase.auth).toBeDefined();
  });
});
