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


export default function Login() {

    const [proccessing, setProcessing] = useState(false);
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
            "phoneNumber": "PHONE-NUMBER",
            "pin": "PIN"
        };

        let response = await fetch(urlWithParams, {
            method: "POST",
            mode: "cors",
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });


        setProcessing(false);
        let keyOluşturucuData = await response.json();

        let apiKeyOluşturucuKod = keyOluşturucuData["code"];

        let apiOluşturucuResponse = await fetch(urlWithParams, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
                "Content-Type": "application/json",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site"
            },
            referrer: "https://m.kentkart.com/",
            body: JSON.stringify({
                clientId: "rH7S2",
                // Statik anahtar
                clientSecret: "Om121T12fSv1j66kp9Un5vE9IMkJ3639",
                loginType: "phone",
                responseType: "code",
                redirectUri: "m.kentkart.com",
                code: apiKeyOluşturucuKod,
                grantType: "authorizationCode",
                phoneNumber: "PHONE-NUMBER",
                countryCode: "tr",
                pin: "PIN"
            })
        });

        let apiKeyData = await apiOluşturucuResponse.json();

        console.log(apiKeyData);
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginTop: 100, color: 'white' }}>Giriş Yap</Text>
            {/**  Telefon Numarası Giriş */}
            <TextInput placeholder="Telefon Numarası" placeholderTextColor="gray" keyboardType="phone-pad" style={{ height: 40, width: "100%", maxWidth: 300, margin: 12, marginHorizontal: "auto", borderWidth: 1, padding: 10, color: 'white', borderColor: 'white' }}></TextInput>
            <TextInput placeholder="Şifre" placeholderTextColor="gray" keyboardType="numeric" secureTextEntry={true} style={{ height: 40, width: "100%", maxWidth: 300, margin: 12, marginHorizontal: "auto", borderWidth: 1, padding: 10, color: 'white', borderColor: 'white' }}></TextInput>

            <Pressable disabled={proccessing} onPress={girişYap} style={{ padding: 10, margin: 12, width: "100%", maxWidth: 300, marginHorizontal: "auto", borderWidth: 1, borderColor: 'white' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: 'white' }}>Giriş</Text>
            </Pressable>


        </View>
    );

}

