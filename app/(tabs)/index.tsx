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
  async function uygulamaGüncellemeleriniDenetle() {
    let response = await fetch("https://api.github.com/repos/swempish/gaziantepkart-client/releases/latest");
    let data = await response.json();
    let mevcutSürüm = data.tag_name;
    let yerelSürüm = pkg.version;
    
    if (yerelSürüm !== null && yerelSürüm.trim().replace("v", "") !== mevcutSürüm.trim().replace("v", "")) {
      setGüncellemeNotu({"title": "Uygulamanın yeni sürümü var!", "description": `Yeni sürüm: ${mevcutSürüm}\nYüklü sürüm: v${yerelSürüm}\nGüncelleme notları:\n\n${data.body}`, "url": `${data.assets[0].browser_download_url}`});
      setUpdateModalVisible(true);
    } else {
    }
    
  }

  async function girişBilgileriniKontrolEt() {
    try {
      let value = await AsyncStorage.getItem('apiKey');
      if (value !== null) {
        let profilDetaylarıİstek = await fetch("https://service.kentkart.com/rl1/api/account?region=028&authType=4&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr", {
          "credentials": "include",
          "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
            "Authorization": `Bearer ${value}`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "If-None-Match": "W/\"2a0-/mg4TePNndJwLreejrLzoZMswRo\""
          },
          "referrer": "https://m.kentkart.com/",
          "method": "GET",
          "mode": "cors"
        });
        let profilDetayları = await profilDetaylarıİstek.json();
        if (profilDetayları["result"]["code"] == "33") {
          router.replace('/login');
          return false;
        }
        if (profilDetayları["result"]["code"] != "0") {
          return false;
        }
        kullanıcıProfili["isim"] = profilDetayları["accountInfo"]["name"];
        kullanıcıProfili["soyisim"] = profilDetayları["accountInfo"]["surname"];
        kullanıcıProfili["email"] = profilDetayları["accountInfo"]["email"];
        kullanıcıProfili["telefon"] = profilDetayları["accountInfo"]["phone"];
        kullanıcıProfili["hesapAçılmaTarihi"] = new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(profilDetayları["accountInfo"]["accountCreateDate"]));
        kullanıcıProfili["profilFotoğrafı"] = "https://api.dicebear.com/9.x/initials/jpg?seed=" + profilDetayları["accountInfo"]["name"] + " " + profilDetayları["accountInfo"]["surname"];
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

  async function kartSorgula(kartNumarası: string) {
    if (kartNumarası.trim() == "") {
      alert("Lütfen kart numarasını giriniz.");
      return;
    }
    setProcessing(true);
    let isLoggedIn = await girişBilgileriniKontrolEt();
    if (!isLoggedIn) {
      setProcessing(false);
      return;
    }
    setResponse({ "cardlist": null, "clientMeta": null });


    let url = "https://service.kentkart.com/rl1/api/card/balance"
    let params = {
      "region": "028",
      "version": "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart",
      "lang": "tr",
      "authType": "4",
      "alias": String(kartNumarası)
    }

    let apiKey = await AsyncStorage.getItem('apiKey');

    let headers = {
      "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 6.1;) AppleWebKit/601.21 (KHTML, like Gecko) Chrome/50.0.2957.192 Safari/600",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "referrer": "https://m.kentkart.com/",
    }

    /**
     * Usage Listesi sonucu
     * type : 0 = Karttan para çekilmiş, kart kullanılmış
     * type : 1 = Karta para yüklenmiş bekleyen işlem
     */

    // Create the URL with query parameters
    let urlWithParams = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      urlWithParams.searchParams.append(key, value);
    }

    fetch(urlWithParams, {
      method: 'GET',
      headers: headers
    })
      .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            alert("Geçerli bir kart numarası giriniz.");

          }   
      })
      .then(data => {

        if (data.result.code == 33) {
          alert(data.result.message);
        }
        data["clientMeta"] = {
          "bakiyeİşlemi": false,
          "miktar": 0,
          "mesaj": ""
        };

        if (data.cardlist[0].oChargeMessage && data.cardlist[0].oChargeMessage != "") {
          data["clientMeta"]["bakiyeİşlemi"] = true;
          data["clientMeta"]["mesaj"] = "Henüz gerçekleşmemiş dolumunuz mevcuttur!\r\n\r\n" + data.cardlist[0].oChargeList[0].datetime + " - " + String(data.cardlist[0].oChargeList[0].amount) + " TL\r\n\r\n";
          data["clientMeta"]["miktar"] = data.cardlist[0].oChargeList[0].amount;
        }


        setResponse(data);
        setProcessing(false);
      })
      .catch(error => {
        alert("Kart bilgilerinizi kontrol ediniz.");
        setProcessing(false);
      });
  }
  function duyurularıGetir() {
    let url = "https://service.kentkart.com/rl1/api/info/announce"
    let params = {
      "region": "028",
      "version": "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart",
      "lang": "tr"
    }

    let headers = {
      "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 6.1;) AppleWebKit/601.21 (KHTML, like Gecko) Chrome/50.0.2957.192 Safari/600",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "If-None-Match": "W/\"5e4-pnubkT+MIpACuTMDw9MwKUpZklA\""
    }

    // Create the URL with query parameters
    let urlWithParams = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      urlWithParams.searchParams.append(key, value);
    }

    fetch(urlWithParams, {
      method: 'GET',
      headers: headers
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
        console.error(error);
      });

  }

  async function tarifeleriGetir() {
    let url = "https://service.kentkart.com/rl1//api/info/tariff"
    let params = {
      "region": "028",
      "version": "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart",
      "lang": "tr"
    }

    let headers = {
      "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 6.1;) AppleWebKit/601.21 (KHTML, like Gecko) Chrome/50.0.2957.192 Safari/600",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "If-None-Match": "W/\"14b9-YoL7VFLSzqNR1AGKjCZb/Dh5jMc\""
    }

    // Create the URL with query parameters
    let urlWithParams = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      urlWithParams.searchParams.append(key, value);
    }

    fetch(urlWithParams, {
      method: 'GET',
      headers: headers
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Error: ${response.status}, ${response.statusText}`);
        }
      })
      .then(data => {

        let temizData = {
          "clientMeta": {
            "öğrenci": 0,
            "tam": 0
          }
        };
        temizData["clientMeta"] = {
          "öğrenci": 0,
          "tam": 0
        };

        // Regex ifadesi
        let regex = /Özel\s?Halk\s?Otobüsü\s?:\s?(\d+(?:\.\d+)?)₺/;

        for (let index = 0; index < data.tariffList.length; index++) {
          const tarife = data.tariffList[index];
          let text = tarife.description;

          if (tarife["id"] == 14 /* Öğrenci */) {
            // Eşleşmeyi bul
            let match = text.match(regex);

            if (match) {
              temizData["clientMeta"]["öğrenci"] = parseFloat(match[1]);
            }
          } else if (tarife["id"] == 16 /* Tam */) {

            let match = text.match(regex);
            if (match) {
              temizData["clientMeta"]["tam"] = parseFloat(match[1]);
            }
          } else {
            continue;
          }
        }

        setTarifeler(temizData);
      })
      .catch(error => {
        console.error(error);
      });


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

        <Modal isVisible={isUpdateModalVisible}>
          <View style={{ backgroundColor: '#fff', borderRadius: 5, padding: 12, }}>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>{güncellemeNotu?.title}</Text>
            <View style={{ height: 1, backgroundColor: 'black', marginBottom: 10 }}></View>
            <Text style={{ color: 'black', textAlign: 'left', fontSize: 16, marginBottom: 20 }}>{güncellemeNotu?.description}</Text>

            <Button title="İNDİR" color={'green'} onPress={() => { Linking.openURL(güncellemeNotu?.url); }} />
            <View style={{ marginBottom: 10 }}></View>
            <Button title="Kapat" onPress={() => setUpdateModalVisible(false)} />
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

