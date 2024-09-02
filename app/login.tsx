import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Platform, View, Text, TextInput, Button, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";


export default function Login() {

    const [proccessing, setProcessing] = useState(false);

    const [numaraInput, setNumaraInput] = useState("");
    const [şifreInput, setŞifreInput] = useState("");

    async function girişYap() {
        setProcessing(true);

        let url = "https://auth.kentkart.com/rl1/oauth/authorize";
        let params = {
            region: "028",
            authType: "4",
            version: "Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart",
            lang: "tr"
        };
        let urlWithParams = new URL(url);
        for (const [key, value] of Object.entries(params)) {
            urlWithParams.searchParams.append(key, value);
        }
        let requestHeaders = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
            "Content-Type": "application/json",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "Priority": "u=0"
        };
        let requestBody = {
            "clientId": "rH7S2",
            "loginType": "phone",
            "responseType": "code",
            "countryCode": "tr",
            "phoneNumber": String(numaraInput),
            "pin": String(şifreInput)
        };

        let response = await fetch(urlWithParams, {
            method: "POST",
            mode: "cors",
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        let keyOluşturucuData = await response.json();
        
        if (keyOluşturucuData["code"] == "411") {
            alert(keyOluşturucuData["message"]);
            setProcessing(false);
            return;
        }

        let apiKeyOluşturucuKod = keyOluşturucuData["code"];

        let apiOluşturucuResponse = await fetch("https://auth.kentkart.com/rl1/oauth/token?region=028&authType=4&version=Web_1.7.2(24)_1.0_FIREFOX_kentkart.web.mkentkart&lang=tr", {
            "credentials": "omit",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
                "Content-Type": "application/json",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site"
            },
            "referrer": "https://m.kentkart.com/",
            "body": "{\"clientId\":\"rH7S2\",\"clientSecret\":\"Om121T12fSv1j66kp9Un5vE9IMkJ3639\",\"redirectUri\":\"m.kentkart.com\",\"code\":\"" + apiKeyOluşturucuKod + "\",\"grantType\":\"authorizationCode\"}",
            "method": "POST",
            "mode": "cors"
        });

        let apiKeyData = await apiOluşturucuResponse.json();
        
        if(apiKeyData["result"]["code"] == 0) {
            // Giriş yapıldı
            await AsyncStorage.setItem('apiKey', apiKeyData["accessToken"]);
            await AsyncStorage.setItem('refreshToken', apiKeyData["refreshToken"]);
            await AsyncStorage.setItem('kartlarım', JSON.stringify([]));
            alert("Giriş yapıldı.");
            router.replace("/");
            setProcessing(false);
        } else {
            alert("Giriş bilgilerinizi doğru girdiğinizden emin olunuz.");
            setProcessing(false);
        }
    }

    
    
    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginTop: 100, color: 'white' }}>Giriş Yap</Text>
            {/**  Telefon Numarası Giriş */}
            <TextInput onChangeText={(text) => { setNumaraInput(text) }} placeholder="Telefon Numarası (5XXXXXXXXX)" placeholderTextColor="gray" keyboardType="phone-pad" style={{ height: 40, width: "100%", maxWidth: 300, margin: 12, marginHorizontal: "auto", borderWidth: 1, padding: 10, color: 'white', borderColor: 'white' }}></TextInput>
            <TextInput onChangeText={(text) => { setŞifreInput(text) }} placeholder="Şifre (PIN)" placeholderTextColor="gray" keyboardType="numeric" secureTextEntry={true} style={{ height: 40, width: "100%", maxWidth: 300, margin: 12, marginHorizontal: "auto", borderWidth: 1, padding: 10, color: 'white', borderColor: 'white' }}></TextInput>

            <Pressable disabled={proccessing} onPress={girişYap} style={{ padding: 10, margin: 12, width: "100%", maxWidth: 300, marginHorizontal: "auto", borderWidth: 1, borderColor: 'white' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: 'white' }}>Giriş</Text>
            </Pressable>

            <ActivityIndicator
                style={{ marginTop: 40 }}
                animating={proccessing}
                color="white"
                size="large"
            />

        </View>
    );

}

