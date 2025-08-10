import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useThemeColors } from "../stores";
import { useAuthStore } from "../stores";
// import { useMyProfile } from "../hooks/queries/useAuth"; // Geçici olarak devre dışı
import {
  Home,
  Search,
  PlusCircle,
  Heart,
  User,
  Settings,
  LogOut,
  MessageCircle,
  FileText,
  Users,
  Crown,
  Package,
  ChevronRight,
  Inbox,
  Clock,
  List,
  Archive,
  Trash2,
  Send,
  HelpCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type MenuItem = {
  label: string;
  icon: any;
  screen?: string;
  color?: string;
  badge?: number;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Profilim", icon: User, screen: "Profile" },
  { label: "Mesajlarım", icon: MessageCircle, screen: "Messages" },
  { label: "İlanlarım", icon: FileText, screen: "MyListings" },
  { label: "Envanterim", icon: Package, screen: "Inventory" },
  { label: "Favorilerim", icon: Heart, screen: "Favorites" },
  { label: "Takip Ettiklerim", icon: Users, screen: "Following" },
  { label: "Aldığım Teklifler", icon: MessageCircle, screen: "ReceivedOffers" },
  { label: "Gönderdiğim Teklifler", icon: MessageCircle, screen: "SentOffers" },
  { label: "Premium Üyelik", icon: Crown, screen: "Premium" },
  { label: "Ayarlar", icon: Settings, screen: "Settings" },
  { label: "Elasticsearch Test", icon: Search, screen: "ElasticsearchTest" },
];

const ProfileMenuScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { user, signOut } = useAuthStore();
  // const { data: profile } = useMyProfile(); // Geçici olarak devre dışı

  const getDisplayName = () => {
    // Geçici olarak basit
    if (user?.email) {
      return user.email;
    } else {
      return 'Kullanıcı';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <User size={48} color={colors.primary} />
          <Text style={[styles.userName, { color: colors.text }]}>
            {getDisplayName()}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => {
                if (item.screen) {
                  if (item.label === "Profilim") {
                    navigation.navigate("ProfileScreen");
                  } else {
                    navigation.navigate(item.screen);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <item.icon size={18} color={colors.textSecondary} style={{ marginRight: 14 }} />
                  <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
                  {item.badge !== undefined && (
                    <View style={[styles.badgeWrap, { marginLeft: 8, backgroundColor: colors.surface }]}> 
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={18} color={colors.textSecondary} style={{ marginLeft: 18 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <LogOut size={22} color={colors.error} style={{ marginRight: 16 }} />
          <Text style={[styles.menuText, { color: colors.error }]}>
            Çıkış Yap
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },
  menuText: {
    fontSize: 17,
    fontWeight: "500",
    textAlign: "left",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  badgeWrap: {
    minWidth: 36,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
});

export default ProfileMenuScreen;
