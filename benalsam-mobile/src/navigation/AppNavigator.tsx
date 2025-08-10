import React, { useEffect } from 'react';
import { Platform, View, Dimensions, StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore, useThemeColors } from '../stores';
import TabBarIcon from '../components/TabBarIcon';
import * as NavigationBar from 'expo-navigation-bar';
import { RootStackParamList } from '../types/navigation';
import InventoryHeaderToggle from '../components/InventoryHeaderToggle';
import { UserPreferencesProvider } from '../contexts/UserPreferencesContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import CreateListingCategoryScreen from '../screens/CreateListingCategoryScreen';
import CreateListingDetailsScreen from '../screens/CreateListingDetailsScreen';
import CreateListingImagesScreen from '../screens/CreateListingImagesScreen';
import CreateListingLocationScreen from '../screens/CreateListingLocationScreen';
import CreateListingConfirmScreen from '../screens/CreateListingConfirmScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileMenuScreen from '../screens/ProfileMenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import EditListingScreen from '../screens/EditListingScreen';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import ConversationScreen from '../screens/ConversationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SecurityScreen from '../screens/SecurityScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InventoryFormScreen from '../screens/InventoryFormScreen';
import StockImageSearchScreen from '../screens/StockImageSearchScreen';
import FollowingScreen from '../screens/FollowingScreen';
import FollowCategoryScreen from '../screens/FollowCategoryScreen';
import MakeOfferScreen from '../screens/MakeOfferScreen';
import ReceivedOffersScreen from '../screens/ReceivedOffersScreen';
import SentOffersScreen from '../screens/SentOffersScreen';
import SelectDistrictScreen from '../screens/SelectDistrictScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TrustScoreScreen from '../screens/TrustScoreScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import AIGenerateListingScreen from '../screens/AIGenerateListingScreen';
import CreateListingMethodScreen from '../screens/CreateListingMethodScreen';
import FirebaseTestScreen from '../screens/FirebaseTestScreen';
import FCMTestScreen from '../screens/FCMTestScreen';
import ModerationScreen from '../screens/ModerationScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import AnalyticsTestScreen from '../screens/AnalyticsTestScreen';
import ElasticsearchTestScreen from '../screens/ElasticsearchTestScreen';
import DopingScreen from '../screens/DopingScreen';
import LeaveReviewScreen from '../screens/LeaveReviewScreen';
import TwoFactorSetupScreen from '../screens/TwoFactorSetupScreen';
import TwoFactorVerifyScreen from '../screens/TwoFactorVerifyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MainTabs = () => {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(colors.surface);
        await NavigationBar.setButtonStyleAsync('light');
        await NavigationBar.setBorderColorAsync(colors.border);
      }
    };

    setupNavigationBar();
  }, [colors]);

  useEffect(() => {
    // console.log('🔵 [Navigation] MainTabs rendered. User state:', user ? 'Logged in' : 'Not logged in');
  }, [user]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
      }}
    >
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent={true}
      />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              route={route}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: Platform.select({
            android: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 60,
              paddingBottom: 6,
              paddingTop: 6,
              borderTopWidth: 1,
              elevation: 8,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            },
            ios: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: 80,
              paddingBottom: 25,
              paddingTop: 8,
              marginBottom: insets.bottom,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "AmazonEmber-Regular",
            marginTop: 2,
          },
          headerShown: false,
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Anasayfa" }}
          listeners={{
            tabPress: () => {
              // console.log("🔵 [Navigation] Home tab pressed");
            },
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: "Arama" }}
          listeners={{
            tabPress: () => {
              // console.log("🔵 [Navigation] Search tab pressed");
            },
          }}
        />
        {user ? (
          <>
            <Tab.Screen
              name="Create"
              component={CreateListingMethodScreen}
              options={{
                title: "",
                tabBarStyle: { display: "none" },
              }}
              listeners={{
                tabPress: () => {
                  // console.log("🔵 [Navigation] Create tab pressed");
                },
              }}
            />
            <Tab.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ title: "Favoriler" }}
              listeners={{
                tabPress: () => {
                  // console.log("🔵 [Navigation] Favorites tab pressed");
                },
              }}
            />
            <Tab.Screen
              name="ProfileMenu"
              component={ProfileMenuScreen}
              options={{ title: "Profil" }}
              listeners={{
                tabPress: () => {
                  // console.log("🔵 [Navigation] Profile tab pressed");
                },
              }}
            />
          </>
        ) : (
          <Tab.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: "Giriş Yap",
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon
                  route={{ name: "Login" }}
                  focused={false}
                  color={color}
                  size={size}
                />
              ),
            }}
            listeners={{
              tabPress: () => {
                // console.log("🔵 [Navigation] Login tab pressed");
              },
            }}
          />
        )}
      </Tab.Navigator>
    </View>
  );
};

const AppNavigator = () => {
  const { user } = useAuthStore();
  const colors = useThemeColors();

  useEffect(() => {
    // console.log('🔵 [Navigation] AppNavigator rendered. User state:', user ? 'Logged in' : 'Not logged in');
  }, [user]);

  return (
    <UserPreferencesProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="MainTabs"
      >
      {/* Public Routes - Her zaman erişilebilir */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] MainTabs screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ListingDetail" 
        component={ListingDetailScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ListingDetail screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ProfileScreen screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] Login screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] Register screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ForgotPassword screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ResetPassword screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ChangePassword screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="PublicProfile" 
        component={PublicProfileScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] PublicProfile screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="AIGenerateListing" 
        component={AIGenerateListingScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] AIGenerateListing screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="ElasticsearchTest" 
        component={ElasticsearchTestScreen}
        options={{
          headerShown: false,
        }}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] ElasticsearchTest screen focused');
          },
        }}
      />
      
      <Stack.Screen
        name="CreateListingCategory"
        component={CreateListingCategoryScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] CreateListingCategory screen focused');
          },
        }}
      />
      <Stack.Screen
        name="CreateListingDetails"
        component={CreateListingDetailsScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] CreateListingDetails screen focused');
          },
        }}
      />
      <Stack.Screen
        name="CreateListingImages"
        component={CreateListingImagesScreen}
        listeners={{
          focus: () => {
            // Screen focused
          },
        }}
      />
      <Stack.Screen
        name="CreateListingLocation"
        component={CreateListingLocationScreen}
        listeners={{
          focus: () => {
            // Screen focused
          },
        }}
      />
      <Stack.Screen
        name="CreateListingConfirm"
        component={CreateListingConfirmScreen}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] CreateListingConfirm screen focused');
          },
        }}
      />
      <Stack.Screen 
        name="TwoFactorVerify" 
        component={TwoFactorVerifyScreen}
        options={{
          headerShown: false,
        }}
        listeners={{
          focus: () => {
            // console.log('🔵 [Navigation] TwoFactorVerify screen focused');
          },
        }}
      />

      {/* Protected Routes - Sadece giriş yapmış kullanıcılar */}
      {user && (
        <>
          <Stack.Screen 
            name="MyListings" 
            component={MyListingsScreen}
            listeners={{
              focus: () => {
                // Screen focused
              },
            }}
          />
          <Stack.Screen 
            name="EditListing" 
            component={EditListingScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] EditListing screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Messages" 
            component={ConversationsListScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Messages screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Conversation" 
            component={ConversationScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Conversation screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Settings screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{
              headerBackButtonMenuEnabled: false,
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] EditProfile screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Inventory" 
            component={InventoryScreen}
            options={() => ({
              headerShown: true,
              title: 'Envanterim',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: colors.surface,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
              },
              headerRight: () => (
                <InventoryHeaderToggle />
              ),
            })}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Inventory screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="InventoryForm" 
            component={InventoryFormScreen}
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.itemId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: colors.surface,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
              },
            })}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] InventoryForm screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="StockImageSearch" 
            component={StockImageSearchScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] StockImageSearch screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Following" 
            component={FollowingScreen}
            options={({ route }) => ({
              headerShown: true,
              title: 'Takip Ettiklerim',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: colors.surface,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
              },
            })}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Following screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="FollowCategory" 
            component={FollowCategoryScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] FollowCategory screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="MakeOffer" 
            component={MakeOfferScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] MakeOffer screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="ReceivedOffers" 
            component={ReceivedOffersScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] ReceivedOffers screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="SentOffers" 
            component={SentOffersScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] SentOffers screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Security" 
            component={SecurityScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Security screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Privacy" 
            component={PrivacyScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Privacy screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="BlockedUsers" 
            component={BlockedUsersScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] BlockedUsers screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="SelectDistrict" 
            component={SelectDistrictScreen}
            options={{
              headerShown: true,
              title: 'İlçe Seçin',
              headerBackTitle: 'Geri',
              headerStyle: {
                backgroundColor: '#000000',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                color: '#ffffff',
              },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] SelectDistrict screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="CreateListingMethod" 
            component={CreateListingMethodScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] CreateListingMethod screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="TrustScore" 
            component={TrustScoreScreen}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] TrustScore screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="FirebaseTest" 
            component={FirebaseTestScreen}
            options={{
              headerShown: true,
              title: 'Firebase Test',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] FirebaseTest screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="FCMTest" 
            component={FCMTestScreen}
            options={{
              headerShown: true,
              title: 'FCM Token Test',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] FCMTest screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="Moderation" 
            component={ModerationScreen}
            options={{
              headerShown: true,
              title: 'Moderasyon Paneli',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] Moderation screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="AnalyticsDashboard" 
            component={AnalyticsDashboardScreen}
            options={{
              headerShown: true,
              title: 'Analitik Dashboard',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] AnalyticsDashboard screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="AnalyticsTest" 
            component={AnalyticsTestScreen}
            options={{
              headerShown: true,
              title: 'Analytics Test',
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] AnalyticsTest screen focused');
              },
            }}
          />
          <Stack.Screen 
            name="TwoFactorSetup" 
            component={TwoFactorSetupScreen}
            options={{
              headerShown: false,
            }}
            listeners={{
              focus: () => {
                // console.log('🔵 [Navigation] TwoFactorSetup screen focused');
              },
            }}
          />


        </>
      )}
      </Stack.Navigator>
    </UserPreferencesProvider>
  );
};

export default AppNavigator; 