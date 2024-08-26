import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Platform, View, Text, TextInput, Button, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import Modal from "react-native-modal";
import { MaskedTextInput } from "react-native-mask-text";
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';


export default function HomeScreen() {
  const [maskedValue, setMaskedValue] = useState("");
  const [unMaskedValue, setUnmaskedValue] = useState("");

  const [proccessing, setProcessing] = useState(false);
  const [response, setResponse] = useState({ "cardlist": null, "clientMeta": null });

  const [duyurular, setDuyurular] = useState();

  const [tarifeler, setTarifeler] = useState({"clientMeta": {"öğrenci": 0,"tam": 0}});

  const [mevcutDuyuru, setMevcutDuyuru] = useState();

  function kartSorgula(kartNumarası: string) {

    setProcessing(true);

    let url = "https://service.kentkart.com/rl1/api/card/balance"
    let params = {
      "region": "028",
      "version": "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart",
      "lang": "tr",
      "authType": "4",
      "alias": String(kartNumarası)
    }

    let headers = {
      "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 6.1;) AppleWebKit/601.21 (KHTML, like Gecko) Chrome/50.0.2957.192 Safari/600",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN}`,
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
          throw new Error(`Error: ${response.status}, ${response.statusText}`);
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
          data["clientMeta"]["mesaj"] = "Henüz gerçekleşmemiş dolumunuz mevcuttur!\r\n\r\n"+ data.cardlist[0].oChargeList[0].datetime +" - "+ String(data.cardlist[0].oChargeList[0].amount) +" TL\r\n\r\n";
          data["clientMeta"]["miktar"] = data.cardlist[0].oChargeList[0].amount;
        }

        
        setResponse(data);
        setProcessing(false);
      })
      .catch(error => {
        console.error(error);
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

      let temizData = {"clientMeta": {
        "öğrenci": 0,
        "tam": 0
      }};
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
        } else if(tarife["id"] == 16 /* Tam */) {
          
          let match = text.match(regex);
          if (match) {
            temizData["clientMeta"]["tam"] = parseFloat(match[1]);
          }
        } else {
          continue;
        }
      }
      

      console.log(JSON.stringify(temizData, null, 4));
      setTarifeler(temizData);
    })
    .catch(error => {
      console.error(error);
    });

    
  }

  useEffect(() => {
    async function fetchData() {
      await duyurularıGetir();
      await tarifeleriGetir();
    }
    fetchData();
  }, []);

  const [isModalVisible, setModalVisible] = useState(false);

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
          <View style={{ flex: 1, backgroundColor: '#000', borderRadius: 5, padding: 10 }}>
            <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 20, marginBottom: 10 }}>{mevcutDuyuru?.title}</Text>
            <Text style={{ color: 'white', textAlign: 'left', fontSize: 16, marginBottom: 20 }}>{mevcutDuyuru?.description}</Text>

            <Button title="Kapat" onPress={toggleModal} />
          </View>
        </Modal>
        <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 30, paddingLeft: 10, paddingTop: 10 }}>Emir's GaziantepKart</Text>
        <Text style={{ color: 'white', textAlign: 'left', fontSize: 12, fontStyle: 'italic', paddingLeft: 10, fontWeight: 'bold', marginBottom: 10 }}>"Ben daha iyisini yaparım."</Text>

        <ScrollView horizontal style={{ flex: 1, flexDirection: 'row', borderRadius: 5, padding: 10, minHeight: 200, marginBottom: 20 }}>

          {
            duyurular != null ?
              (duyurular?.map((item, index) => (
                <Pressable onPress={() => { setMevcutDuyuru(item); toggleModal(); }} key={index} style={{ margin: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 3, maxWidth: 300, width: '100%' }}>
                  <Text numberOfLines={1} style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>{item.title}</Text>
                  <Text style={{ color: '#a0a0a0', textAlign: 'left', fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>{item.description}</Text>
                </Pressable>
              ))) : <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} size="large" color="white" />
          }

        </ScrollView>

        <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24, marginBottom: 10, marginLeft: 10 }}>Tarifeler</Text>
        <Text style={{ color: 'white', textAlign: 'left', fontSize: 15, marginBottom: 10, marginLeft: 10 }}>{"Öğrenci: " + tarifeler["clientMeta"]["öğrenci"] + " TL\nTam: " + tarifeler["clientMeta"]["tam"] + " TL\n"}</Text>

        <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100 }}>
          <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Bakiye sorgula</Text>
          <MaskedTextInput mask="99999-99999-9" onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }} keyboardType='numeric' placeholder="Kart numarası. Örn. 12345-12345-1" style={{ color: 'black', textAlign: 'left', fontSize: 15, backgroundColor: 'white', height: 40, borderRadius: 5, marginVertical: 10, paddingHorizontal: 10 }} />
          <Button title="Sorgula" disabled={!maskedValue} onPress={() => kartSorgula(unMaskedValue)} />
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
              { response["clientMeta"]!["bakiyeİşlemi"] && (
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>{response["clientMeta"]!["mesaj"]}</Text>
              ) }
              <View style={{  padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Kart Numarası</Text>
                <Text style={{ color: '#0a7ea4', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{maskedValue}</Text>
              </View>

              <View style={{  padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Bakiye</Text>
                <Text style={{ color: '#388E3C', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>₺ {response['cardlist']![0]['balance']}</Text>
              </View>

              <View style={{  padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Kalan Kullanım</Text>
                <Text style={{ color: '#388E3C', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{ tarifeler["clientMeta"]["öğrenci"] != 0 ? Math.floor(response['cardlist']![0]['balance'] / tarifeler["clientMeta"]["öğrenci"]) : " - " } Biniş</Text>
              </View>

              <View style={{  padding: 10, minHeight: 100 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Son Kullanım Tarihi</Text>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginTop: 10 }}>{response['cardlist']![0]['usage'][0]["date"]}</Text>
                <Text style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>₺ {response['cardlist']![0]['usage'][0]["amt"]}</Text>
              </View>

              <View style={{  padding: 10, minHeight: 100 }}>
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

