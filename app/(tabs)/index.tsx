import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Platform, View, Text, TextInput, Button } from 'react-native';
import { ActivityIndicator } from "react-native";
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { MaskedTextInput } from "react-native-mask-text";
import { API_TOKEN } from "@env";

export default function HomeScreen() {
  const [maskedValue, setMaskedValue] = useState("");
  const [unMaskedValue, setUnmaskedValue] = useState("");

  const [proccessing, setProcessing] = useState(false);
  const [response, setResponse] = useState({ "cardlist": null });

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
      "Authorization": `Bearer ${API_TOKEN}`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "referrer": "https://m.kentkart.com/",
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
        setResponse(data);
        setProcessing(false);
      })
      .catch(error => {
        console.error(error);
        setProcessing(false);
      });
  }


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/gaziantep.jpg')}
          style={{ resizeMode: 'cover', height: 250, width: '100%' }}
        />
      }>

      <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Gaziantep Kart</Text>
      <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100 }}>
        <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Bakiye sorgula</Text>
        <MaskedTextInput mask="99999-99999-9" onChangeText={(text, rawText) => { setMaskedValue(text); setUnmaskedValue(rawText); }} keyboardType='numeric' placeholder="12345-12345-1" style={{ color: 'black', textAlign: 'left', fontSize: 15, backgroundColor: 'white', height: 40, borderRadius: 5, marginVertical: 10, paddingHorizontal: 10 }} />
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
        <View style={{ flex: 1, borderColor: 'gray', borderWidth: 1, borderRadius: 5, padding: 10, minHeight: 100, flexDirection: 'column', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24 }}>Kart bilgileri</Text>
          <View style={{ flexDirection: 'column', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
            <View style={{ borderWidth: 1, borderColor: 'white', borderRadius: 5, padding: 10, minHeight: 100 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Kart Numarası</Text>
              <Text style={{ color: '#0a7ea4', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{response['cardlist']![0]['aliasNo']}</Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: 'white', borderRadius: 5, padding: 10, minHeight: 100 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Bakiye</Text>
              <Text style={{ color: '#388E3C', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>₺ {response['cardlist']![0]['balance']}</Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: 'white', borderRadius: 5, padding: 10, minHeight: 100 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>Son Kullanım Tarihi</Text>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 24 }}>{response['cardlist']![0]['usage'][0]["date"]}</Text>
            </View>
          </View>
        </View>
      }

    </ParallaxScrollView>
  );
}
