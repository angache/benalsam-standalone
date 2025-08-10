import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../stores';
import { Header, Button, Card } from '../components';

const ListingRulesScreen = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <Card style={styles.rulesCard}>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Platformumuzda adil ve güvenli bir ortam sağlamak için lütfen aşağıdaki kurallara uyun.
          </Text>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              1. Yasalara Uygunluk
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Yasa dışı ürün veya hizmetlerin (silah, uyuşturucu, çalıntı mal vb.) ilanı kesinlikle yasaktır.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              2. Doğru Bilgi
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              İlan başlığı, açıklaması, kategorisi ve görselleri aradığınız ürün veya hizmeti doğru ve net bir şekilde yansıtmalıdır. Yanıltıcı bilgi vermek yasaktır.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              3. Tek İlan Kuralı
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Aynı ürün veya hizmet için birden fazla ilan yayınlamak yasaktır. Farklı ilanlar, farklı ihtiyaçları belirtmelidir.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              4. Fiyatlandırma
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Belirttiğiniz bütçe, aradığınız ürün veya hizmet için gerçekçi ve makul olmalıdır. Sembolik veya yanıltıcı fiyatlar girmeyin.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              5. Görsel Kalitesi
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Yüklenen görseller net olmalı ve aranan ürünü temsil etmelidir. Başka ilanlardan veya internetten alınmış, telif hakkı içeren görseller kullanılamaz.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              6. İletişim Bilgileri
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              İlan açıklamasına telefon numarası, e-posta adresi gibi kişisel iletişim bilgileri eklemek yasaktır. İletişim, platform üzerinden mesajlaşma veya teklif sistemi ile sağlanmalıdır.
            </Text>
          </View>

          <View style={styles.rulesSection}>
            <Text style={[styles.ruleTitle, { color: colors.text }]}>
              7. Yasaklı İçerik
            </Text>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Ayrımcılık, nefret söylemi, hakaret, şiddet içeren veya müstehcen içeriklerin kullanılması yasaktır.
            </Text>
          </View>

          <View style={[styles.warningBox, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
            <Text style={[styles.warningText, { color: '#dc2626' }]}>
              Bu kurallara uymayan ilanlar, yöneticilerimiz tarafından uyarı yapılmaksızın kaldırılabilir ve kullanıcının hesabı askıya alınabilir.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Anladım, Kapat"
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  rulesCard: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  rulesSection: {
    marginBottom: 20,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});

export default ListingRulesScreen; 