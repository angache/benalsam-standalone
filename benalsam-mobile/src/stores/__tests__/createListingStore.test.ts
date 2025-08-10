import { renderHook, act } from "@testing-library/react-native";
import { useCreateListingStore } from "../createListingStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("CreateListingStore", () => {
  beforeEach(() => {
    useCreateListingStore.getState().reset();
    jest.clearAllMocks();
  });

  it("has correct initial state", () => {
    const { result } = renderHook(() => useCreateListingStore());
    expect(result.current.data).toEqual({});
  });

  it("sets step data correctly", () => {
    const { result } = renderHook(() => useCreateListingStore());
    
    act(() => {
      result.current.setStepData("category", "electronics");
    });
    
    expect(result.current.data.category).toBe("electronics");
  });

  it("sets details data correctly", () => {
    const { result } = renderHook(() => useCreateListingStore());
    
    const detailsData = {
      title: "Test Product",
      description: "Test description",
      price: 1000,
      condition: "new",
    };
    
    act(() => {
      result.current.setStepData("details", detailsData);
    });
    
    expect(result.current.data.details).toEqual(detailsData);
  });

  it("resets store data correctly", () => {
    const { result } = renderHook(() => useCreateListingStore());
    
    act(() => {
      result.current.setStepData("category", "electronics");
    });
    
    expect(result.current.data.category).toBe("electronics");
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.data).toEqual({});
  });

  it("handles multiple step updates", () => {
    const { result } = renderHook(() => useCreateListingStore());
    
    act(() => {
      result.current.setStepData("category", "electronics");
      result.current.setStepData("details", {
        title: "Smartphone",
        price: 5000,
        condition: "new",
      });
    });
    
    expect(result.current.data.category).toBe("electronics");
    expect(result.current.data.details?.title).toBe("Smartphone");
  });
});
