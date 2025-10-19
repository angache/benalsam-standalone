'use client'

import { create } from 'zustand'

export interface UIState {
  // Modal states
  isLoginModalOpen: boolean
  isRegisterModalOpen: boolean
  isCreateListingModalOpen: boolean
  isEditListingModalOpen: boolean
  isImageEditorModalOpen: boolean
  isPremiumModalOpen: boolean
  
  // Drawer/Sidebar states
  isMobileMenuOpen: boolean
  isMobileSidebarOpen: boolean
  isNotificationDrawerOpen: boolean
  
  // Loading states
  isGlobalLoading: boolean
  loadingMessage: string | null
  
  // Actions
  openLoginModal: () => void
  closeLoginModal: () => void
  openRegisterModal: () => void
  closeRegisterModal: () => void
  openCreateListingModal: () => void
  closeCreateListingModal: () => void
  openEditListingModal: () => void
  closeEditListingModal: () => void
  openImageEditorModal: () => void
  closeImageEditorModal: () => void
  openPremiumModal: () => void
  closePremiumModal: () => void
  
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleNotificationDrawer: () => void
  closeNotificationDrawer: () => void
  
  setGlobalLoading: (loading: boolean, message?: string) => void
  closeAllModals: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // Initial states
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isCreateListingModalOpen: false,
  isEditListingModalOpen: false,
  isImageEditorModalOpen: false,
  isPremiumModalOpen: false,
  
  isMobileMenuOpen: false,
  isMobileSidebarOpen: false,
  isNotificationDrawerOpen: false,
  
  isGlobalLoading: false,
  loadingMessage: null,

  // Modal actions
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  
  openRegisterModal: () => set({ isRegisterModalOpen: true }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  
  openCreateListingModal: () => set({ isCreateListingModalOpen: true }),
  closeCreateListingModal: () => set({ isCreateListingModalOpen: false }),
  
  openEditListingModal: () => set({ isEditListingModalOpen: true }),
  closeEditListingModal: () => set({ isEditListingModalOpen: false }),
  
  openImageEditorModal: () => set({ isImageEditorModalOpen: true }),
  closeImageEditorModal: () => set({ isImageEditorModalOpen: false }),
  
  openPremiumModal: () => set({ isPremiumModalOpen: true }),
  closePremiumModal: () => set({ isPremiumModalOpen: false }),

  // Drawer/Sidebar actions
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  
  toggleNotificationDrawer: () => set((state) => ({ isNotificationDrawerOpen: !state.isNotificationDrawerOpen })),
  closeNotificationDrawer: () => set({ isNotificationDrawerOpen: false }),

  // Global loading
  setGlobalLoading: (loading, message) => set({ isGlobalLoading: loading, loadingMessage: message || null }),

  // Close all modals
  closeAllModals: () => set({
    isLoginModalOpen: false,
    isRegisterModalOpen: false,
    isCreateListingModalOpen: false,
    isEditListingModalOpen: false,
    isImageEditorModalOpen: false,
    isPremiumModalOpen: false,
    isMobileMenuOpen: false,
    isMobileSidebarOpen: false,
    isNotificationDrawerOpen: false,
  }),
}))

