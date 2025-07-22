import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Platform, View, Text, TextInput, Button, ActivityIndicator, ScrollView, Pressable, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from "react-native-modal";
import { MaskedTextInput } from "react-native-mask-text";
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView
} from 'react-native-safe-area-context';
import { router } from "expo-router";


export default function HomeScreen() {
  const pkg = require('../../package.json');

  const [maskedValue, setMaskedValue] = useState("");
  const [unMaskedValue, setUnmaskedValue] = useState("");

  const [proccessing, setProcessing] = useState(false);
  const [response, setResponse] = useState({ "cardlist": null, "clientMeta": null });

  const [duyurular, setDuyurular] = useState([{ "title": "", "description": "" }]);

  const [tarifeler, setTarifeler] = useState({ "clientMeta": { "öğrenci": 0, "tam": 0 } });

  const [mevcutDuyuru, setMevcutDuyuru] = useState({ "description": "", "title": "" });
  const [güncellemeNotu, setGüncellemeNotu] = useState({ "description": "", "title": "", "url": "" });

  var kullanıcıProfili = {
    "isim": "",
    "soyisim": "",
    "email": "",
    "telefon": "",
    "hesapAçılmaTarihi": "",
    "profilFotoğrafı": "https://api.dicebear.com/9.x/initials/jpg?seed="
  }
  const [profil, setProfilDetayları] = useState(kullanıcıProfili);
  var apiKey = null;

  // TODO: KART KAYDETME FONKSIYONUNU EKLE
  async function kartKaydet(kartNumarası: string) {
    kartNumarası = kartNumarası.trim().replace(" ", "").replace("-", "");

  }
  // Sabitler ve yardımcı fonksiyonlar
  const API_BASE = "https://service.kentkart.com/rl1/api";
  const REGION = "028";
  const VERSION = "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart";
  const LANG = "tr";

  function getDefaultHeaders(extraHeaders: Record<string, string> = {}) {
    return {
      "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 6.1;) AppleWebKit/601.21 (KHTML, like Gecko) Chrome/50.0.2957.192 Safari/600",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/json",
      ...extraHeaders
    };
  }

  function buildUrl(path: string, params: Record<string, any> = {}) {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries({ region: REGION, version: VERSION, lang: LANG, ...params }).forEach(
      ([key, value]) => url.searchParams.append(key, value)
    );
    return url;
  }

  function handleApiError(error: unknown, fallbackMsg = "Bir hata oluştu.") {
    console.error(error);
    alert(fallbackMsg);
  }

  // Versiyon karşılaştırma fonksiyonu
  function compareVersions(v1: string, v2: string): number {
    // v1 > v2: 1, v1 < v2: -1, eşit: 0
    const toNum = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const a = toNum(v1);
    const b = toNum(v2);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const n1 = a[i] || 0;
      const n2 = b[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }

  async function uygulamaGüncellemeleriniDenetle() {
    try {
      let response = await fetch("https://api.github.com/repos/swempish/gaziantepkart-client/releases/latest");
      let data = await response.json();
      let mevcutSürüm = data.tag_name;
      let yerelSürüm = pkg.version;
      // Eğer yerel sürüm yayınlanan sürümden yeniyse veya eşitse panel gösterilmesin
      if (
        yerelSürüm && mevcutSürüm &&
        compareVersions(yerelSürüm, mevcutSürüm) < 0
      ) {
        setGüncellemeNotu({
          title: "Uygulamanın yeni sürümü var!",
          description: `Yeni sürüm: ${mevcutSürüm}\nYüklü sürüm: v${yerelSürüm}\nGüncelleme notları:\n\n${data.body}`,
          url: data.assets[0].browser_download_url
        });
        setUpdateModalVisible(true);
      }
    } catch (error) {
      handleApiError(error, "Güncelleme kontrolü sırasında hata oluştu.");
    }
  }

  // girişBilgileriniKontrolEt fonksiyonu
  async function girişBilgileriniKontrolEt() {
    try {
      let value = await AsyncStorage.getItem('apiKey');
      if (value !== null) {
        let profilDetaylarıİstek = await fetch(buildUrl("/account", { authType: 4 }), {
          credentials: "include",
          headers: getDefaultHeaders({
            Authorization: `Bearer ${value}`,
            "If-None-Match": "W/\"2a0-/mg4TePNndJwLreejrLzoZMswRo\""
          }),
          referrer: "https://m.kentkart.com/",
          method: "GET",
          mode: "cors"
        });
        let profilDetayları = await profilDetaylarıİstek.json();
        if (profilDetayları?.result?.code == "33") {
          router.replace('/login');
          return false;
        }
        if (profilDetayları?.result?.code != "0") {
          return false;
        }
        kullanıcıProfili = {
          ...kullanıcıProfili,
          isim: profilDetayları.accountInfo.name,
          soyisim: profilDetayları.accountInfo.surname,
          email: profilDetayları.accountInfo.email,
          telefon: profilDetayları.accountInfo.phone,
          hesapAçılmaTarihi: new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(profilDetayları.accountInfo.accountCreateDate)),
          profilFotoğrafı: `https://api.dicebear.com/9.x/initials/jpg?seed=${profilDetayları.accountInfo.name} ${profilDetayları.accountInfo.surname}`
        };
        setProfilDetayları(kullanıcıProfili);
        return true;
      } else {
        alert("Önce giriş yapmalısınız.");
        router.replace('/login');
        return false;
      }
    } catch (e) {
      alert("Önce giriş yapmalısınız.");
      router.replace('/login');
      return false;
    }
  }

  // kartSorgula fonksiyonu
  async function kartSorgula(kartNumarası: string) {
    if (kartNumarası.trim() === "") {
      alert("Lütfen kart numarasını giriniz.");
      return;
    }
    setProcessing(true);
    let isLoggedIn = await girişBilgileriniKontrolEt();
    if (!isLoggedIn) {
      setProcessing(false);
      return;
    }
    setResponse({ cardlist: null, clientMeta: null });
    let apiKey = await AsyncStorage.getItem('apiKey');
    let headers = getDefaultHeaders({
      Authorization: `Bearer ${apiKey}`,
      referrer: "https://m.kentkart.com/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site"
    });
    let url = buildUrl("/card/balance", { authType: 4, alias: String(kartNumarası) });
    fetch(url, {
      method: 'GET',
      headers
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          alert("Geçerli bir kart numarası giriniz.");
        }
      })
      .then(data => {
        if (!data) return;
        if (data.result.code == 33) {
          alert(data.result.message);
        }
        data.clientMeta = {
          bakiyeİşlemi: false,
          miktar: 0,
          mesaj: ""
        };
        if (data.cardlist[0]?.oChargeMessage) {
          data.clientMeta.bakiyeİşlemi = true;
          data.clientMeta.mesaj = `Henüz gerçekleşmemiş dolumunuz mevcuttur!\r\n\r\n${data.cardlist[0].oChargeList[0].datetime} - ${String(data.cardlist[0].oChargeList[0].amount)} TL\r\n\r\n`;
          data.clientMeta.miktar = data.cardlist[0].oChargeList[0].amount;
        }
        setResponse(data);
        setProcessing(false);
      })
      .catch(error => {
        handleApiError(error, "Kart bilgilerinizi kontrol ediniz.");
        setProcessing(false);
      });
  }
  // duyurularıGetir fonksiyonu
  function duyurularıGetir() {
    let url = buildUrl("/info/announce");
    let headers = getDefaultHeaders({
      "If-None-Match": "W/\"5e4-pnubkT+MIpACuTMDw9MwKUpZklA\""
    });
    fetch(url, {
      method: 'GET',
      headers
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Error: ${response.status}, ${response.statusText}`);
        }
      })
      .then(data => {
        setDuyurular(data.announceList);
      })
      .catch(error => {
        handleApiError(error);
      });
  }

  // tarifeleriGetir fonksiyonu
  async function tarifeleriGetir() {
    try {
      const response = await fetch("https://acikveriapi.gaziantep.bel.tr/api/Ulasim/UcretTarifesi");
      const data = await response.json();
      // Belediye (Şehir İçi) satırını bul
      const sehirIci = data.data.find((item: any) => item.type === "Belediye (Şehir İçi)");
      let temizData = { clientMeta: { öğrenci: 0, tam: 0 } };
      if (sehirIci) {
        temizData.clientMeta.öğrenci = sehirIci.student || 0;
        temizData.clientMeta.tam = sehirIci.full || 0;
      }
      setTarifeler(temizData);
    } catch (error) {
      handleApiError(error, "Ücret tarifeleri alınırken hata oluştu.");
    }
  }

  useEffect(() => {
    async function fetchData() {
      await girişBilgileriniKontrolEt();
      await duyurularıGetir();
      await tarifeleriGetir();
      await uygulamaGüncellemeleriniDenetle();
    }
    fetchData();
  }, []);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (

    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <ScrollView style={{ width: "100%", marginHorizontal: "auto" }}>

        <Image
          source={require('@/assets/images/gaziantep.jpg')}
          style={{ resizeMode: 'cover', height: 250, width: '100%', }}
        />
        <View style={{ position: 'absolute', height: 250, width: '100%', }}>
          <LinearGradient
            // Background Linear Gradient
            colors={['transparent', 'rgba(0,0,0,1)']}
            style={{ height: 250, width: '100%' }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        <Modal isVisible={isModalVisible}>
          <View style={{ backgroundColor: '#fff', borderRadius: 5, padding: 12, }}>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>{mevcutDuyuru?.title}</Text>
            <View style={{ height: 1, backgroundColor: 'black', marginBottom: 10 }}></View>
            <Text style={{ color: 'black', textAlign: 'left', fontSize: 16, marginBottom: 20 }}>{mevcutDuyuru?.description}</Text>

            <Button title="Kapat" onPress={toggleModal} />
          </View>
        </Modal>

        <Modal isVisible={isUpdateModalVisible}
          animationIn="zoomInDown"
          animationOut="zoomOutUp"
          animationInTiming={700}
          animationOutTiming={500}
          backdropTransitionInTiming={700}
          backdropTransitionOutTiming={500}
          useNativeDriver={true}
          backdropOpacity={0.5}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 }}>
            <View style={{ backgroundColor: '#e0f2f1', borderRadius: 50, padding: 16, marginBottom: 16 }}>
              <Image source={require('@/assets/images/adaptive-icon.png')} style={{ width: 48, height: 48, borderRadius: 24 }} />
            </View>
            <Text style={{ color: '#222', textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginBottom: 10, letterSpacing: 0.5 }}>{güncellemeNotu?.title}</Text>
            <View style={{ height: 2, backgroundColor: '#0a7ea4', marginBottom: 16, width: 60, alignSelf: 'center', borderRadius: 2 }}></View>
            {/* Sürüm Bilgileri */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ backgroundColor: '#e0f2f1', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginRight: 4 }}>
                <Text style={{ color: '#0a7ea4', fontWeight: 'bold', fontSize: 15 }}>Yeni sürüm</Text>
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>{güncellemeNotu?.description?.match(/Yeni sürüm: ([^\n]+)/)?.[1] || '-'}</Text>
              </View>
              <View style={{ backgroundColor: '#f1f8e9', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginLeft: 4 }}>
                <Text style={{ color: '#388E3C', fontWeight: 'bold', fontSize: 15 }}>Yüklü sürüm</Text>
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>{güncellemeNotu?.description?.match(/Yüklü sürüm: ([^\n]+)/)?.[1] || '-'}</Text>
              </View>
            </View>
            {/* Güncelleme Notları */}
            <Text style={{ color: '#0a7ea4', fontWeight: 'bold', fontSize: 17, marginBottom: 6, alignSelf: 'flex-start' }}>Güncelleme Notları</Text>
            <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 20, alignSelf: 'stretch' }}>
              <ScrollView style={{ maxHeight: 120 }}>
                <Text style={{ color: '#444', fontSize: 15, lineHeight: 21 }}>
                  {güncellemeNotu?.description?.split('Güncelleme notları:')[1]?.trim() || ''}
                </Text>
              </ScrollView>
            </View>
            <Pressable onPress={() => { Linking.openURL(güncellemeNotu?.url); }} style={{ backgroundColor: '#388E3C', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12, width: '100%' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center', letterSpacing: 1 }}>İNDİR</Text>
            </Pressable>
            <Pressable onPress={() => setUpdateModalVisible(false)} style={{ backgroundColor: '#e0e0e0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, width: '100%' }}>
              <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Kapat</Text>
            </Pressable>
          </View>
        </Modal>

        <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 30, paddingLeft: 10, paddingTop: 10 }}>Emir's GaziantepKart</Text>
        <Text style={{ color: 'white', textAlign: 'left', fontSize: 12, fontStyle: 'italic', paddingLeft: 10, fontWeight: 'bold', marginBottom: 10 }}>"Ben daha iyisini yaparım."</Text>

        <View style={{ padding: 10, display: 'flex', flexDirection: 'row' }}>
          <Image source={{ uri: profil["profilFotoğrafı"] }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          <View style={{ marginLeft: 10, width: '100%' }}>
            <Text numberOfLines={1} style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24, marginTop: 10 }}>{profil["isim"]} {profil["soyisim"]}</Text>
            <Text numberOfLines={1} style={{ color: 'white', textAlign: 'left', fontSize: 13, fontFamily: 'monospace' }}>{profil["email"] == "" ? (("+90" + String(profil["telefon"])).substring(0, 8) + "******") : profil["email"]}</Text>
            <Text numberOfLines={1} style={{ color: 'white', textAlign: 'left', fontSize: 11, fontFamily: 'monospace' }}>
              Hesap Açılma Tarihi: {profil["hesapAçılmaTarihi"]}
            </Text>

            <View style={{ marginTop: 10, maxWidth: 150 }}>
              <Button title="Çıkış Yap" onPress={() => { AsyncStorage.setItem('apiKey', ''); router.push('/login'); }} />
            </View>
          </View>
        </View>


        <ScrollView horizontal style={{ flex: 1, flexDirection: 'row', borderRadius: 5, padding: 10, minHeight: 200, marginBottom: 20 }}>

          {
            duyurular != null ?
              (duyurular?.map((item, index) => (
                <Pressable onPress={() => { setMevcutDuyuru(item); toggleModal(); }} key={index} style={{ margin: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 3, maxWidth: 300, width: '100%' }}>
                  <Text numberOfLines={1} style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>{item?.title}</Text>
                  <Text style={{ color: '#afafa0', textAlign: 'left', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>{item?.description}</Text>
                </Pressable>
              ))) : <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} size="large" color="white" />
          }

        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10, paddingHorizontal: 10 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>Tarifeler</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 15, marginRight: 10 }}>{"Öğrenci: " + tarifeler["clientMeta"]["öğrenci"] + " TL"}</Text>
            <Text style={{ color: 'white', fontSize: 15, marginRight: 10 }}>{"Tam: " + tarifeler["clientMeta"]["tam"] + " TL"}</Text>
          </View>
        </View>

        {/**
         * TODO: Kaydetme fonksiyonunu ekle
         * 
        <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100, marginBottom: 10 }}>
          <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Kart Kaydet</Text>
          <MaskedTextInput mask="99999-99999-9" onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }} keyboardType='numeric' placeholder="Kart numarası. Örn. 12345-12345-1" style={{ color: 'black', textAlign: 'left', fontSize: 15, backgroundColor: 'white', height: 40, borderRadius: 5, marginVertical: 10, paddingHorizontal: 10 }} />
          <Button title="Sorgula" onPress={() => kartKaydet(unMaskedValue)} />
        </View>
        *
        */}

        <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100 }}>
          <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Bakiye sorgula</Text>
          <MaskedTextInput mask="99999-99999-9" onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }} keyboardType='numeric' placeholder="Kart numarası. Örn. 12345-12345-1" style={{ color: 'black', textAlign: 'left', fontSize: 15, backgroundColor: 'white', height: 40, borderRadius: 5, marginVertical: 10, paddingHorizontal: 10 }} />
          <Button title="Sorgula" onPress={() => kartSorgula(unMaskedValue)} />
        </View>

        {
          proccessing &&
          <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100, flexDirection: 'column', justifyContent: 'space-between' }}>
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#0a7ea4" />
          </View>
        }

        {
          (response["cardlist"] && !proccessing) &&
          <View style={{ marginTop: 20, flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100, flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Kart bilgileri</Text>
            <View style={{ flexDirection: 'column', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              {response["clientMeta"]!["bakiyeİşlemi"] && (
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>{response["clientMeta"]!["mesaj"]}</Text>
              )}
              <View style={{ padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Kart Numarası</Text>
                <Text style={{ color: '#0a7ea4', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{maskedValue}</Text>
              </View>

              <View style={{ padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Bakiye</Text>
                <Text style={{ color: '#388E3C', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>₺ {response['cardlist']![0]['balance']}</Text>
              </View>

              <View style={{ padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Kalan Kullanım</Text>
                <Text style={{ color: '#388E3C', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{tarifeler["clientMeta"]["öğrenci"] != 0 ? Math.floor(response['cardlist']![0]['balance'] / tarifeler["clientMeta"]["öğrenci"]) : " - "} Biniş</Text>
              </View>

              <View style={{ padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Son Kullanım Tarihi</Text>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginTop: 10 }}>{response['cardlist']![0]['usage'][0]["date"]}</Text>
                <Text style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>₺ {response['cardlist']![0]['usage'][0]["amt"]}</Text>
              </View>

              <View style={{ padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Son Yükleme Tarihi</Text>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginTop: 10 }}>{response['cardlist']![0]['usage'][1]["date"]}</Text>
                <Text style={{ color: 'green', textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>₺ {response['cardlist']![0]['usage'][1]["amt"]}</Text>
              </View>
            </View>
          </View>
        }

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>


  );
}

