import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaskedTextInput } from "react-native-mask-text";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import Modal from "react-native-modal";
const gaziantepImage = require('../../assets/images/gaziantep.jpg');

// Açık tema renkleri
const COLORS = {
  background: '#F7FAFC',
  card: '#FFFFFF',
  primary: '#1976D2',
  secondary: '#64B5F6',
  text: '#222',
  muted: '#6B7280',
  border: '#E3E8EF',
  success: '#43A047',
  warning: '#FFA726',
  info: '#0288D1',
};

export default function HomeScreen() {
  // Profil
  const [profil, setProfil] = useState<any>(null);
  const [profilLoading, setProfilLoading] = useState(true);

  // Kart sorgulama
  const [maskedValue, setMaskedValue] = useState("");
  const [unMaskedValue, setUnmaskedValue] = useState("");
  const [proccessing, setProcessing] = useState(false);
  const [kartBilgi, setKartBilgi] = useState<null | {
    bakiye: number;
    kalanBinisOgrenci: number | null;
    kalanBinisTam: number | null;
    sonKullanim: string;
    sonKullanimMiktar: number | null;
    sonYukleme: string;
    sonYuklemeMiktar: number | null;
    bekleyenDolumMesaj: string | null;
    bekleyenDolumMiktar: number | null;
  }>(null);
  const [sorgulananKartNo, setSorgulananKartNo] = useState<string>("");

  // Duyurular
  const [duyurular, setDuyurular] = useState<any[]>([]);
  const [duyuruLoading, setDuyuruLoading] = useState(true);

  // Tarifeler
  const [tarifeler, setTarifeler] = useState({ ogrenci: 0, tam: 0 });
  const [tarifeLoading, setTarifeLoading] = useState(true);

  // Hata
  const [hata, setHata] = useState<string | null>(null);

  // Duyuru modalı
  const [selectedDuyuru, setSelectedDuyuru] = useState<any | null>(null);
  const [isDuyuruModalVisible, setDuyuruModalVisible] = useState(false);

  const openDuyuruModal = (duyuru: any) => {
    setSelectedDuyuru(duyuru);
    setDuyuruModalVisible(true);
  };
  const closeDuyuruModal = () => {
    setDuyuruModalVisible(false);
    setSelectedDuyuru(null);
  };

  // Profil bilgisini yükle
  useEffect(() => {
    async function fetchProfil() {
      setProfilLoading(true);
      try {
        const apiKey = await AsyncStorage.getItem('apiKey');
        if (!apiKey) {
          setProfil(null);
          setProfilLoading(false);
          router.push('/login');
          return;
        }
        const resp = await fetch("https://service.kentkart.com/rl1/api/account?region=028&authType=4&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr", {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json, text/plain, */*",
          },
        });
        const data = await resp.json();
        if (data?.result?.code === "33") { // Token geçersiz veya oturum yok
          setProfil(null);
          router.push('/login');
        } else {
          setProfil({
            isim: data.accountInfo.name,
            soyisim: data.accountInfo.surname,
            email: data.accountInfo.email,
            telefon: data.accountInfo.phone,
            hesapAçılmaTarihi: new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(data.accountInfo.accountCreateDate)),
            profilFotoğrafı: `https://api.dicebear.com/7.x/initials/webp?seed=${data.accountInfo.name}%20${data.accountInfo.surname}`
          });
        }
      } catch (e) {
        setProfil(null);
        Alert.alert('Profil alınamadı', 'Ağ veya sunucu hatası.');
      }
      setProfilLoading(false);
    }
    fetchProfil();
  }, []);

  // Duyuruları çek
  useEffect(() => {
    async function fetchDuyurular() {
      setDuyuruLoading(true);
      try {
        const resp = await fetch("https://service.kentkart.com/rl1/api/info/announce?region=028&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr");
        const data = await resp.json();
        setDuyurular(data.announceList || []);
      } catch (e) {
        setDuyurular([]);
      }
      setDuyuruLoading(false);
    }
    fetchDuyurular();
  }, []);

  // Tarifeleri çek
  useEffect(() => {
    async function fetchTarifeler() {
      setTarifeLoading(true);
      try {
        const resp = await fetch("https://acikveriapi.gaziantep.bel.tr/api/Ulasim/UcretTarifesi");
        const data = await resp.json();
        const sehirIci = data.data.find((item: any) => item.type === "Belediye (Şehir İçi)");
        if (sehirIci) {
          setTarifeler({ ogrenci: sehirIci.student || 0, tam: sehirIci.full || 0 });
        }
      } catch (e) {
        setTarifeler({ ogrenci: 0, tam: 0 });
      }
      setTarifeLoading(false);
    }
    fetchTarifeler();
  }, []);

  // Kart sorgulama fonksiyonu
  const kartSorgula = async () => {
    setProcessing(true);
    setHata(null);
    setKartBilgi(null);
    // setSorgulananKartNo(""); // Sorgulama başında sıfırlama yok, sadece başarılı olursa güncellenecek
    if (unMaskedValue.length !== 11) {
      setHata("Lütfen geçerli bir kart numarası giriniz.");
      setProcessing(false);
      return;
    }
    try {
      const apiKey = await AsyncStorage.getItem('apiKey');
      if (!apiKey) {
        setHata("Önce giriş yapmalısınız.");
        setProcessing(false);
        return;
      }
      const url = `https://service.kentkart.com/rl1/api/card/balance?region=028&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr&authType=4&alias=${unMaskedValue}`;
      const resp = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json, text/plain, */*",
        },
      });
      const data = await resp.json();
      if (!data.cardlist || !data.cardlist[0]) {
        setHata("Kart bulunamadı veya geçersiz.");
        setProcessing(false);
        return;
      }
      const bakiye = data.cardlist[0].balance;
      const kalanBinisOgrenci = tarifeler.ogrenci ? Math.floor(bakiye / tarifeler.ogrenci) : null;
      const kalanBinisTam = tarifeler.tam ? Math.floor(bakiye / tarifeler.tam) : null;
      const usage = data.cardlist[0].usage || [];
      // Son kullanım ve yükleme miktarları
      const sonKullanim = usage[0]?.date || "-";
      const sonKullanimMiktar = usage[0]?.amt ?? null;
      const sonYukleme = usage[1]?.date || "-";
      const sonYuklemeMiktar = usage[1]?.amt ?? null;
      // Bekleyen dolum
      let bekleyenDolumMesaj: string | null = null;
      let bekleyenDolumMiktar: number | null = null;
      if (data.cardlist[0]?.oChargeMessage && data.cardlist[0]?.oChargeList?.[0]) {
        bekleyenDolumMesaj = data.cardlist[0].oChargeMessage;
        bekleyenDolumMiktar = data.cardlist[0].oChargeList[0].amount;
      }
      setKartBilgi({
        bakiye,
        kalanBinisOgrenci,
        kalanBinisTam,
        sonKullanim,
        sonKullanimMiktar,
        sonYukleme,
        sonYuklemeMiktar,
        bekleyenDolumMesaj,
        bekleyenDolumMiktar
      });
      setSorgulananKartNo(maskedValue); // Sadece başarılı sorguda güncelle
    } catch (e) {
      setHata("Kart sorgulanırken hata oluştu.");
    }
    setProcessing(false);
  };

  // Çıkış
  const handleLogout = async () => {
    await AsyncStorage.setItem('apiKey', '');
    setProfil(null);
    Alert.alert('Çıkış yapıldı', 'Giriş ekranına yönlendirileceksiniz.');
    router.push('/login');
  };

  // Tarih formatlayıcı
  function getTodayStr() {
    return new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Üstte Gaziantep görseli, şehir adı ve tarih */}
        <View style={styles.topBannerBox}>
          <Image source={gaziantepImage} style={styles.topBannerImage} />
          <View style={styles.topBannerOverlay}>
            <Text style={styles.topBannerCity}>GKart Client</Text>
            <Text style={styles.topBannerDate}>{getTodayStr()}</Text>
          </View>
        </View>
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          {profilLoading ? (
            <ActivityIndicator color={COLORS.primary} size="large" />
          ) : profil ? (
            <>
              <Image source={{ uri: profil.profilFotoğrafı }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.profileName}>{profil.isim} {profil.soyisim}</Text>
                {profil.email ? (
                  <Text style={styles.profileEmail}>{profil.email}</Text>
                ) : null}
                <Text style={styles.profilePhone}>{maskPhone(profil.telefon)}</Text>
                <Text style={styles.profileDate}>Kayıt: {profil.hesapAçılmaTarihi}</Text>
              </View>
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
              </Pressable>
            </>
          ) : (
            <Text style={styles.errorText}>Giriş yapmalısınız.</Text>
          )}
        </View>

        {/* Kart Sorgulama Alanı */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Kart Bakiye Sorgulama</Text>
          <MaskedTextInput
            mask="99999-99999-9"
            onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }}
            keyboardType="numeric"
            placeholder="Kart numarası. Örn. 12345-12345-1"
            style={styles.maskedInput}
            value={maskedValue}
          />
          <Pressable style={styles.sorgulaBtn} onPress={kartSorgula} disabled={proccessing}>
            {proccessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.sorgulaBtnText}>Sorgula</Text>}
          </Pressable>
          {hata && <Text style={styles.errorText}>{hata}</Text>}
        </View>

        {/* Sonuçlar */}
        {kartBilgi && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Kart Bilgileri</Text>
            {/* Bekleyen dolum varsa uyarı kutusu */}
            {kartBilgi.bekleyenDolumMesaj && (
              <View style={styles.pendingBox}>
                <Text style={styles.pendingTitle}>Bekleyen Dolum</Text>
                <Text style={styles.pendingMsg}>{kartBilgi.bekleyenDolumMesaj}</Text>
                <Text style={styles.pendingAmount}>₺ {kartBilgi.bekleyenDolumMiktar}</Text>
              </View>
            )}
            <View style={styles.resultRow}>
              <MaterialIcons name="credit-card" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.resultLabel}>Kart Numarası:</Text>
              <Text style={styles.resultValue}>{sorgulananKartNo}</Text>
            </View>
            <View style={styles.resultRow}>
              <Ionicons name="wallet" size={20} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.resultLabel}>Bakiye:</Text>
              <Text style={[styles.resultValue, { color: COLORS.success }]}>₺ {kartBilgi.bakiye}</Text>
            </View>
            {/* Kalan Biniş - Öğrenci */}
            <View style={styles.resultRow}>
              <MaterialIcons name="school" size={20} color={COLORS.info} style={{ marginRight: 6 }} />
              <Text style={styles.resultLabel}>Kalan Biniş (Öğrenci):</Text>
              <Text style={styles.resultValue}>{kartBilgi.kalanBinisOgrenci !== null ? kartBilgi.kalanBinisOgrenci : '-'}</Text>
          </View>
            {/* Kalan Biniş - Tam */}
            <View style={styles.resultRow}>
              <Ionicons name="person" size={20} color={COLORS.warning} style={{ marginRight: 6 }} />
              <Text style={styles.resultLabel}>Kalan Biniş (Tam):</Text>
              <Text style={styles.resultValue}>{kartBilgi.kalanBinisTam !== null ? kartBilgi.kalanBinisTam : '-'}</Text>
            </View>
            {/* Son Kullanım ve Son Yükleme - Yan yana kutucuklar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <View style={styles.infoMiniBox}>
                <Text style={styles.infoMiniTitle}>Son Kullanım</Text>
                <Text style={styles.infoMiniDate}>{kartBilgi.sonKullanim}</Text>
                <Text style={styles.infoMiniAmount}>₺ {kartBilgi.sonKullanimMiktar !== null ? kartBilgi.sonKullanimMiktar : '-'}</Text>
          </View>
              <View style={styles.infoMiniBox}>
                <Text style={styles.infoMiniTitle}>Son Yükleme</Text>
                <Text style={styles.infoMiniDate}>{kartBilgi.sonYukleme}</Text>
                <Text style={styles.infoMiniAmount}>₺ {kartBilgi.sonYuklemeMiktar !== null ? kartBilgi.sonYuklemeMiktar : '-'}</Text>
          </View>
        </View>
          </View>
        )}

        {/* Duyurular */}
        <Text style={styles.sectionTitle}>Duyurular</Text>
        {duyuruLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {duyurular.map((item, idx) => (
              <Pressable
                key={idx}
                style={styles.announcementCard}
                onPress={() => openDuyuruModal(item)}
              >
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementDesc} numberOfLines={3}>{item.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Duyuru Modalı */}
        <Modal
          isVisible={isDuyuruModalVisible}
          animationIn="zoomIn"
          animationOut="zoomOut"
          animationInTiming={400}
          animationOutTiming={300}
          backdropOpacity={0.5}
          onBackdropPress={closeDuyuruModal}
          useNativeDriver={true}
          style={{ justifyContent: 'center', alignItems: 'center', margin: 0 }}
        >
          <View style={styles.duyuruModalBox}>
            <Text style={styles.duyuruModalTitle}>{selectedDuyuru?.title}</Text>
            <View style={{ height: 2, backgroundColor: COLORS.primary, marginVertical: 10, borderRadius: 2 }} />
            <ScrollView style={{ maxHeight: 250, marginBottom: 18 }}>
              <Text style={styles.duyuruModalDesc}>{selectedDuyuru?.description}</Text>
            </ScrollView>
            <Pressable style={styles.duyuruModalBtn} onPress={closeDuyuruModal}>
              <Text style={styles.duyuruModalBtnText}>Kapat</Text>
            </Pressable>
          </View>
        </Modal>

        {/* Tarifeler */}
        <Text style={styles.sectionTitle}>Ücret Tarifeleri</Text>
        {tarifeLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.tarifeRow}>
            <View style={[styles.tarifeCard, { backgroundColor: '#E3F2FD' }]}> 
              <MaterialIcons name="school" size={24} color={COLORS.primary} />
              <Text style={styles.tarifeLabel}>Öğrenci</Text>
              <Text style={styles.tarifeValue}>{tarifeler.ogrenci} TL</Text>
              </View>
            <View style={[styles.tarifeCard, { backgroundColor: '#FFFDE7' }]}> 
              <Ionicons name="person" size={24} color={COLORS.warning} />
              <Text style={styles.tarifeLabel}>Tam</Text>
              <Text style={styles.tarifeValue}>{tarifeler.tam} TL</Text>
              </View>
              </View>
        )}

        {/* Footer */}
        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
          <Text style={styles.footer}>© {new Date().getFullYear()} GaziantepKart Client</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 }}
              onPress={() => Linking.openURL('https://instagram.com/boriemir')}
            >
              <Ionicons name="logo-instagram" size={20} color="#C13584" style={{ marginRight: 4, marginTop: 17 }} />
              <Text style={styles.footer}>boriemir</Text>
            </Pressable>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 }}
              onPress={() => Linking.openURL('https://github.com/swempish')}
            >
              <Ionicons name="logo-github" size={20} color="#222" style={{ marginRight: 4, marginTop: 17 }} />
              <Text style={styles.footer}>swempish</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  profileEmail: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 2,
  },
  profilePhone: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  profileDate: {
    color: COLORS.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  logoutBtn: {
    marginLeft: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 8,
  },
  cardBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  maskedInput: {
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: '#F1F5F9',
    height: 44,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sorgulaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 6,
    alignItems: 'center',
  },
  sorgulaBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  errorText: {
    color: '#D32F2F',
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  resultTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultLabel: {
    color: COLORS.muted,
    fontSize: 15,
    marginRight: 4,
    minWidth: 110,
  },
  resultValue: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  announcementCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 16,
    marginLeft: 16,
    marginBottom: 8,
    minWidth: 220,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  announcementTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  announcementDesc: {
    color: COLORS.text,
    fontSize: 14,
  },
  tarifeRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  tarifeCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  tarifeLabel: {
    color: COLORS.muted,
    fontSize: 15,
    marginTop: 6,
  },
  tarifeValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 24,
    marginBottom: 8,
  },
  infoMiniBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  infoMiniTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  infoMiniDate: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 2,
  },
  infoMiniAmount: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 15,
  },
  pendingBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  pendingTitle: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  pendingMsg: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'center',
  },
  pendingAmount: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 16,
  },
  duyuruModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  duyuruModalTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  duyuruModalDesc: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 22,
  },
  duyuruModalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  duyuruModalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: 1,
  },
  topBannerBox: {
    width: '100%',
    height: 140,
    marginBottom: 12,
    position: 'relative',
  },
  topBannerImage: {
    width: '100%',
    height: 140,
    // borderBottomLeftRadius: 24,
    // borderBottomRightRadius: 24,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
  },
  topBannerCity: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  topBannerDate: {
    color: '#fff',
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

function maskPhone(phone: string) {
  // Sadece rakamları al
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  // +90 532 43* ** **
  return `+90 ${digits.slice(0,3)} ${digits.slice(3,5)}* ** **`;
}

function getUsageAmount(date: string) {
  // Bu fonksiyon, kartBilgi içindeki usage listesinden ilgili tarihe karşılık gelen miktarı bulur.
  // Şu an panelde usage miktarı tutulmuyor, bu yüzden örnek olarak '-' döndürüyoruz.
  // Gerçek kullanım için kartBilgi'ye usage listesini de ekleyip buradan çekebilirsiniz.
  return '-';
}

