import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MarkdownText } from '../utils/MarkdownText';
import COLORS from '../utils/colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const faqData = [
  {
    question: 'GKart Client uygulaması nedir?',
    answer: 'GKart Client, toplu taşıma kartınızı yönetmenizi, bakiyenizi sorgulamanızı ve güncel duyuruları görmenizi sağlayan, resmî Gaziantep Kart uygulamasına alternatif olarak geliştirilmiş açık kaynak kodlu bir mobil uygulamadır.'
  },
  {
    question: 'GKart Client güvenli mi?',
    answer: 'GKart Client, verileri aracı olmadan doğrudan GaziantepKart sitesinden çeker. Uygulama açık kaynak kodlu olduğundan, topluluk tarafından denetlenebilir ve güvenlik açıkları hızla tespit edilip giderilebilir.'
  },
  {
    question: 'Nasıl giriş yapabilirim?',
    answer: 'Giriş yapabilmek için [resmî uygulamada](https://play.google.com/store/apps/details?id=kentkart.mobile.gaziantepkart) bir hesaba sahip olmanız gerekmektedir. Hesap oluşturmak için [resmî uygulamayı](https://play.google.com/store/apps/details?id=kentkart.mobile.gaziantepkart) indirebilir ya da [resmî siteden](https://online.gaziantepkart.com.tr/) kayıt olabilirsiniz. Hesabınız varsa, telefon numaranız ve şifrenizle giriş yapabilirsiniz.'
  },
  {
    question: 'Giriş Yapamıyorum',
    answer:
        'Uygulama şu anda yalnızca telefon numarasıyla giriş yapmayı destekliyor. Her şeyi doğru yaptığınız hâlde hâlâ giriş yapamıyorsanız önce [resmî uygulamadan](https://play.google.com/store/apps/details?id=kentkart.mobile.gaziantepkart) veya [resmî siteden](https://online.gaziantepkart.com.tr/) giriş yapmayı deneyin. Uzun süredir kullanılmayan hesaplarda SMS doğrulaması gerektiği için resmî kanallardan giriş yapmak sorunu genellikle çözer. Hâlâ sorun yaşıyorsanız uygulamanın [GitHub](https://github.com/swempish/gaziantepkart-client/) sayfasından destek talebinde bulunabilirsiniz.'
  },  
  {
    question: 'Kartıma nasıl bakiye yüklerim?',
    answer: 'Maalesef GKart Client uygulaması üzerinden bakiye yükleme işlemi yapılamamaktadır. Bakiye yükleme işlemleri için [resmî uygulamayı](https://play.google.com/store/apps/details?id=kentkart.mobile.gaziantepkart) kullanabilir veya [resmî siteden](https://online.gaziantepkart.com.tr/) bakiye yükleyebilirsiniz.'
  }
];

export default function InfoScreen() {
  const router = useRouter();
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
        <Ionicons name="arrow-back" size={28} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Bilgi & SSS</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Sıkça Sorulan Sorular</Text>
        {faqData.map((item, idx) => (
          <View key={idx} style={styles.faqItem}>
            <TouchableOpacity onPress={() => toggleIndex(idx)} style={styles.faqQuestionRow}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons
                name={openIndexes.includes(idx) ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={COLORS.muted}
              />
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <MarkdownText style={styles.faqAnswer}>{item.answer}</MarkdownText>
            )}
          </View>
        ))}
        {/* Hakkımda & İletişim */}
        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>Geliştirici Hakkında</Text>
          <Text style={styles.aboutText}>Merhaba! Ben Emirhan Çolak, {new Date().getFullYear() - 2007} yaşındayım.</Text>
          <Text style={styles.aboutText}>Benimle iletişime geçmek veya projelerimi görmek için:</Text>
          <MarkdownText style={styles.aboutLink}>[GitHub](https://github.com/swempish)  |  [Reddit](https://reddit.com/u/swempish)  |  [Instagram](https://instagram.com/boriemir)</MarkdownText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    zIndex: 10,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    alignSelf: 'center',
    marginBottom: 18,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 21,
  },
  guideBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  guideText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  aboutBox: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 22,
    marginTop: 32,
    marginBottom: 28,
    borderWidth: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  aboutTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    letterSpacing: 0.2,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  aboutText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.92,
  },
  aboutLink: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.1,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
