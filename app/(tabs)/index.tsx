import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Linking, Alert, Animated, Easing, TextInput, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaskedTextInput } from "react-native-mask-text";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import Modal from "react-native-modal";
import uuid from 'react-native-uuid';
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

// Kayıtlı kartlar için veri modeli ve işlemler

type KayitliKart = {
  id: string; // uuid
  ad: string;
  kartNo: string; // maskelenmiş veya düz
  bakiye: number;
  sonKullanim: string;
  sonKullanimMiktar: number | null;
  sonYukleme: string;
  sonYuklemeMiktar: number | null;
  bekleyenDolumMesaj: string | null;
  bekleyenDolumMiktar: number | null;
  kayitTarihi: string;
  guncellenmeTarihi: string;
};

// Kayıtlı kartları getir
async function getKayitliKartlar(): Promise<KayitliKart[]> {
  const data = await AsyncStorage.getItem('kartlarim');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Kayıtlı kartları kaydet
async function setKayitliKartlar(kartlar: KayitliKart[]): Promise<void> {
  await AsyncStorage.setItem('kartlarim', JSON.stringify(kartlar));
}

// Yeni kart ekle
async function addKayitliKart(kart: KayitliKart): Promise<void> {
  const kartlar = await getKayitliKartlar();
  kartlar.push(kart);
  await setKayitliKartlar(kartlar);
}

// Kart güncelle (id ile)
async function updateKayitliKart(id: string, yeniKart: Partial<KayitliKart>): Promise<void> {
  const kartlar = await getKayitliKartlar();
  const idx = kartlar.findIndex(k => k.id === id);
  if (idx !== -1) {
    kartlar[idx] = { ...kartlar[idx], ...yeniKart, guncellenmeTarihi: new Date().toISOString() };
    await setKayitliKartlar(kartlar);
  }
}

// Kart sil (id ile)
async function deleteKayitliKart(id: string): Promise<void> {
  const kartlar = await getKayitliKartlar();
  const yeniKartlar = kartlar.filter(k => k.id !== id);
  await setKayitliKartlar(yeniKartlar);
}

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

  // En yeni uygulama sürümü
  const [enYeniVersiyon, setEnYeniVersiyon] = useState<string | null>(null);

  // Tarifeler
  const [tarifeler, setTarifeler] = useState({ ogrenci: 0, tam: 0 });
  const [tarifeLoading, setTarifeLoading] = useState(true);

  // Hata
  const [hata, setHata] = useState<string | null>(null);

  // Duyuru modalı
  const [selectedDuyuru, setSelectedDuyuru] = useState<any | null>(null);
  const [isDuyuruModalVisible, setDuyuruModalVisible] = useState(false);

  // Kayıtlı kartlar
  const [kayitliKartlar, setKayitliKartlar] = useState<KayitliKart[]>([]);
  const [kartlarLoading, setKartlarLoading] = useState(true);
  const [kartEkleModal, setKartEkleModal] = useState(false);
  const [yeniKartNo, setYeniKartNo] = useState("");
  const [yeniKartAd, setYeniKartAd] = useState("");
  const [yeniKartHata, setYeniKartHata] = useState<string|null>(null);
  const [yeniKartLoading, setYeniKartLoading] = useState(false);
  const [guncellenenKartId, setGuncellenenKartId] = useState<string|null>(null);

  // Kart silme modalı için state
  const [silModalVisible, setSilModalVisible] = useState(false);
  const [silModalKartId, setSilModalKartId] = useState<string|null>(null);

  const openDuyuruModal = (duyuru: any) => {
    setSelectedDuyuru(duyuru);
    setDuyuruModalVisible(true);
  };
  const closeDuyuruModal = () => {
    setDuyuruModalVisible(false);
    setSelectedDuyuru(null);
  };

  // Github'dan en yeni uygulama sürümünü çek
  useEffect(() => {
    async function fetchLatestVersion() {
      try {
        const resp = await fetch("https://api.github.com/repos/swempish/gaziantepkart-client/releases/latest");
        const data = await resp.json();
        if (data?.tag_name) {
          setEnYeniVersiyon(data.tag_name.replace(/^v/, ''));
        }
      } catch {}
    }
    fetchLatestVersion();
  }, []);

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
        // Profil alınamadığında -ki bu genelde oturumun süresinin dolduğu anlamına gelir-
        setProfil(null);
        router.push('/login');
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

  // Uygulama açılışında kayıtlı kartları yükle
  useEffect(() => {
    async function loadKartlar() {
      setKartlarLoading(true);
      const kartlar = await getKayitliKartlar();
      setKayitliKartlar(kartlar);
      setKartlarLoading(false);
      // Arka planda güncelle
      kartlar.forEach(kart => guncelleKartBilgi(kart.id, kart.kartNo));
    }
    loadKartlar();
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

  // Kart ekleme işlemi
  async function handleKartEkle() {
    setYeniKartHata(null);
    if (!yeniKartNo || yeniKartNo.length !== 11) {
      setYeniKartHata("Lütfen geçerli bir kart numarası giriniz.");
      return;
    }
    if (!yeniKartAd || yeniKartAd.length < 2) {
      setYeniKartHata("Kart adı en az 2 karakter olmalı.");
      return;
    }
    setYeniKartLoading(true);
    try {
      // Kartı API ile sorgula
      const apiKey = await AsyncStorage.getItem('apiKey');
      if (!apiKey) {
        setYeniKartHata("Önce giriş yapmalısınız.");
        setYeniKartLoading(false);
        return;
      }
      const url = `https://service.kentkart.com/rl1/api/card/balance?region=028&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr&authType=4&alias=${yeniKartNo}`;
      const resp = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json, text/plain, */*",
        },
      });
      const data = await resp.json();
      if (!data.cardlist || !data.cardlist[0]) {
        setYeniKartHata("Kart bulunamadı veya geçersiz.");
        setYeniKartLoading(false);
        return;
      }
      const kart = data.cardlist[0];
      const usage = kart.usage || [];
      let bekleyenDolumMesaj: string | null = null;
      let bekleyenDolumMiktar: number | null = null;
      if (kart?.oChargeMessage && kart?.oChargeList?.[0]) {
        bekleyenDolumMesaj = kart.oChargeMessage;
        bekleyenDolumMiktar = kart.oChargeList[0].amount;
      }
      const yeniKayit: KayitliKart = {
        id: uuid.v4() as string,
        ad: yeniKartAd,
        kartNo: yeniKartNo,
        bakiye: kart.balance,
        sonKullanim: usage[0]?.date || "-",
        sonKullanimMiktar: usage[0]?.amt ?? null,
        sonYukleme: usage[1]?.date || "-",
        sonYuklemeMiktar: usage[1]?.amt ?? null,
        bekleyenDolumMesaj,
        bekleyenDolumMiktar,
        kayitTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };
      await addKayitliKart(yeniKayit);
      setKayitliKartlar(await getKayitliKartlar());
      setKartEkleModal(false);
      setYeniKartNo("");
      setYeniKartAd("");
    } catch (e) {
      setYeniKartHata("Kart eklenirken hata oluştu.");
    }
    setYeniKartLoading(false);
  }

  // Kart bilgisini güncelle (ikonlu animasyonlu)
  async function guncelleKartBilgi(id: string, kartNo: string) {
    setGuncellenenKartId(id);
    try {
      const apiKey = await AsyncStorage.getItem('apiKey');
      if (!apiKey) return;
      const url = `https://service.kentkart.com/rl1/api/card/balance?region=028&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr&authType=4&alias=${kartNo}`;
      const resp = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json, text/plain, */*",
        },
      });
      const data = await resp.json();
      if (!data.cardlist || !data.cardlist[0]) return;
      const kart = data.cardlist[0];
      const usage = kart.usage || [];
      let bekleyenDolumMesaj: string | null = null;
      let bekleyenDolumMiktar: number | null = null;
      if (kart?.oChargeMessage && kart?.oChargeList?.[0]) {
        bekleyenDolumMesaj = kart.oChargeMessage;
        bekleyenDolumMiktar = kart.oChargeList[0].amount;
      }
      await updateKayitliKart(id, {
        bakiye: kart.balance,
        sonKullanim: usage[0]?.date || "-",
        sonKullanimMiktar: usage[0]?.amt ?? null,
        sonYukleme: usage[1]?.date || "-",
        sonYuklemeMiktar: usage[1]?.amt ?? null,
        bekleyenDolumMesaj,
        bekleyenDolumMiktar,
      });
      setKayitliKartlar(await getKayitliKartlar());
    } catch {}
    setGuncellenenKartId(null);
  }

  // Kart silme
  async function handleKartSil(id: string) {
    await deleteKayitliKart(id);
    setKayitliKartlar(await getKayitliKartlar());
    setSilModalVisible(false);
    setSilModalKartId(null);
  }

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
            <Pressable style={{width: "100%"}} onPress={() => router.push('/login')}>
              <Text style={{padding: 20, margin: "auto", fontSize: 25, fontWeight: "bold", color: COLORS.primary}}>Giriş yap</Text>
            </Pressable>
          )}
        </View>

        {/* Yeni sürüm uyarısı */}
        {enYeniVersiyon && (() => {
          const mevcutVersiyon = require('../../package.json').version;
          if (mevcutVersiyon !== enYeniVersiyon) {
            return (
              <View
                style={{
                  backgroundColor: '#FFF8E1',
                  borderColor: '#FFD54F',
                  borderWidth: 1.5,
                  paddingVertical: 18,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  marginBottom: 18,
                  marginHorizontal: 18,
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#FFB300',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="alert-circle" size={28} color="#FFA000" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>
                      Yeni sürüm mevcut: v{enYeniVersiyon}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                      Uygulamanız güncel değil. En son özellikler ve iyileştirmeler için güncelleyin.
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => Linking.openURL('https://github.com/swempish/gaziantepkart-client/releases/latest')}
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 10,
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    marginLeft: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 5,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="logo-github" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>
                    Güncelle
                  </Text>
                </Pressable>
              </View>
            );
          }
          return null;
        })()}

        {/* Kayıtlı Kartlar */}
        <Text style={styles.sectionTitle}>Kayıtlı Kartlar</Text>
        {kartlarLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, paddingHorizontal: 12, marginRight: 12 }}>
            {kayitliKartlar.map((kart) => (
              <View key={kart.id} style={[styles.kayitliKartCard, { marginRight: 12, overflow: 'hidden', borderColor: kart.bekleyenDolumMiktar ? '#FFB300' : COLORS.card }]}> 
                {/* Güncelleniyor overlay */}
                {guncellenenKartId === kart.id && (
                  <View style={styles.kartGuncelleOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.kayitliKartAd}>{kart.ad}</Text>
                  <Pressable onPress={() => guncelleKartBilgi(kart.id, kart.kartNo)} disabled={guncellenenKartId === kart.id}>
                    <Animated.View style={{ transform: [{ rotate: guncellenenKartId === kart.id ? '360deg' : '0deg' }] }}>
                      <Ionicons name="refresh" size={22} color={COLORS.info} />
                    </Animated.View>
                  </Pressable>
                </View>
                <Text style={styles.kayitliKartNo}>{maskKartNo(kart.kartNo)}</Text>
                <Text style={styles.kayitliKartBakiye}>₺ {kart.bakiye}</Text>
                {kart.bekleyenDolumMiktar && (
                  <Text style={styles.kayitliKartBekleyenDolum}>Bekleyen Dolum: ₺ {kart.bekleyenDolumMiktar}</Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <View style={styles.infoMiniBox}>
                    <Text style={styles.infoMiniTitle}>Son Kullanım</Text>
                    <Text style={styles.infoMiniDate}>{kart.sonKullanim}</Text>
                    <Text style={styles.infoMiniAmount}>{kart.sonKullanimMiktar !== null ? `₺${kart.sonKullanimMiktar}` : '-'}</Text>
                  </View>
                  <View style={styles.infoMiniBox}>
                    <Text style={styles.infoMiniTitle}>Son Yükleme</Text>
                    <Text style={styles.infoMiniDate}>{kart.sonYukleme}</Text>
                    <Text style={styles.infoMiniAmount}>{kart.sonYuklemeMiktar !== null ? `₺${kart.sonYuklemeMiktar}` : '-'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: "auto" }}>
                  <Text style={styles.kayitliKartZaman}>Güncellendi: {new Date(kart.guncellenmeTarihi).toLocaleString('tr-TR')}</Text>
                  <Pressable style={{padding: 4 }} onPress={() => { setSilModalVisible(true); setSilModalKartId(kart.id); }} disabled={guncellenenKartId === kart.id}>
                    <Ionicons name="trash" size={18} color="#D32F2F" />
                  </Pressable>
                </View>
              </View>
            ))}
            {/* Kart Ekle Kartı */}
            <Pressable
            disabled={profilLoading || !profil}
              style={[styles.kartEkleCard, { marginRight: 12, height: 250 }]}
              onPress={() => setKartEkleModal(true)}
            >
              <Ionicons name="add-circle" size={48} color={COLORS.primary} />
              <Text style={styles.kartEkleText}>Kart Ekle</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Kart Sorgulama Alanı */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Kart Sorgulama</Text>
          <MaskedTextInput
            mask="99999-99999-9"
            onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }}
            keyboardType="numeric"
            placeholder="Kart numarası. Örn. 12345-12345-1"
            style={styles.maskedInput}
            value={maskedValue}
          />
          <Pressable style={styles.sorgulaBtn} onPress={kartSorgula} disabled={proccessing || profilLoading || !profil}>
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

        {/* Kart Ekle Modalı */}
        <Modal
          isVisible={kartEkleModal}
          animationIn="zoomIn"
          animationOut="zoomOut"
          animationInTiming={400}
          animationOutTiming={300}
          backdropOpacity={0.5}
          onBackdropPress={() => setKartEkleModal(false)}
          useNativeDriver={true}
          style={{ justifyContent: 'center', alignItems: 'center', margin: 0 }}
        >
          <View style={styles.kartEkleModalBox}>
            <Text style={styles.kartEkleModalTitle}>Kart Ekle</Text>
            <TextInput
              placeholder="Kart Adı (ör. Kendi Kartım)"
              style={styles.kartEkleInput}
              value={yeniKartAd}
              onChangeText={setYeniKartAd}
              autoFocus
            />
            <TextInput
              placeholder="Kart Numarası (11 haneli)"
              style={styles.kartEkleInput}
              value={yeniKartNo}
              onChangeText={setYeniKartNo}
              keyboardType="numeric"
              maxLength={11}
            />
            {yeniKartHata && <Text style={styles.errorText}>{yeniKartHata}</Text>}
            <Pressable style={styles.kartEkleBtn} onPress={handleKartEkle} disabled={yeniKartLoading}>
              {yeniKartLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.kartEkleBtnText}>Kaydet</Text>}
            </Pressable>
            <Pressable style={styles.kartEkleIptalBtn} onPress={() => setKartEkleModal(false)}>
              <Text style={styles.kartEkleIptalBtnText}>İptal</Text>
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

        {/* Kart Silme Onay Modalı */}
        <Modal
          isVisible={silModalVisible}
          animationIn="zoomIn"
          animationOut="zoomOut"
          animationInTiming={350}
          animationOutTiming={250}
          backdropOpacity={0.5}
          onBackdropPress={() => setSilModalVisible(false)}
          useNativeDriver={true}
          style={{ justifyContent: 'center', alignItems: 'center', margin: 0 }}
        >
          <View style={styles.silModalBox}>
            <Text style={styles.silModalTitle}>Kartı silmek istediğinize emin misiniz?</Text>
            <Text style={styles.silModalDesc}>Bu işlem geri alınamaz.</Text>
            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <Pressable style={styles.silModalBtn} onPress={() => setSilModalVisible(false)}>
                <Text style={styles.silModalBtnText}>İptal</Text>
              </Pressable>
              <Pressable style={[styles.silModalBtn, { backgroundColor: '#D32F2F', marginLeft: 16 }]} onPress={() => silModalKartId && handleKartSil(silModalKartId)}>
                <Text style={[styles.silModalBtnText, { color: '#fff' }]}>Sil</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  kartEkleCard: {
    width: 140,
    height: 180,
    backgroundColor: '#E3F2FD',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  kartEkleText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  kayitliKartCard: {
    width: 270,
    height: 250,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: COLORS.card, // default, dinamikte override
  },
  kayitliKartBekleyenDolum: {
    color: '#FF9800',
    fontSize: 13,
    marginTop: 2,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  kayitliKartAd: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 17,
  },
  kayitliKartNo: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 2,
  },
  kayitliKartBakiye: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 4,
    marginBottom: 2,
  },
  kayitliKartLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  kayitliKartInfo: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  kayitliKartZaman: {
    color: COLORS.secondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  kartEkleModalBox: {
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
  kartEkleModalTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  kartEkleInput: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kartEkleBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  kartEkleBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: 1,
  },
  kartEkleIptalBtn: {
    backgroundColor: '#E3E8EF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  kartEkleIptalBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  kartGuncelleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  silModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  silModalTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  silModalDesc: {
    color: COLORS.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  silModalBtn: {
    backgroundColor: '#E3E8EF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  silModalBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
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

function maskKartNo(kartNo: string) {
  if (!kartNo || kartNo.length !== 11) return kartNo;
  return kartNo.slice(0, 5) + '-' + kartNo.slice(5, 10) + '-' + kartNo.slice(10);
}

