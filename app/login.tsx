import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View, Text, TextInput, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
    const [proccessing, setProcessing] = useState(false);
    const [numaraInput, setNumaraInput] = useState("");
    const [şifreInput, setŞifreInput] = useState("");
    const [numaraFocus, setNumaraFocus] = useState(false);
    const [şifreFocus, setŞifreFocus] = useState(false);
    const [timeoutPanel, setTimeoutPanel] = useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    async function girişYap() {
        setProcessing(true);
        setTimeoutPanel(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setProcessing(false);
            setTimeoutPanel(true);
        }, 20000);

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
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
            router.replace("/");
            setProcessing(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
            alert("Giriş bilgilerinizi doğru girdiğinizden emin olunuz.");
            setProcessing(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    }

    return (
        <View style={styles.solidBg}>
            {timeoutPanel && (
                <View style={styles.timeoutPanel}>
                    <Text style={styles.timeoutTitle}>Zaman Aşımı</Text>
                    <Text style={styles.timeoutText}>Giriş işlemi 20 saniyeden uzun sürdü. Lütfen tekrar deneyin.</Text>
                    <View style={{ flexDirection: 'row', marginTop: 16 }}>
                        <Pressable style={styles.timeoutButton} onPress={() => { setTimeoutPanel(false); }}>
                            <Text style={styles.timeoutButtonText}>Kapat</Text>
                        </Pressable>
                        <Pressable style={[styles.timeoutButton, { marginLeft: 12, backgroundColor: '#e53935' }]} onPress={() => { setTimeoutPanel(false); girişYap(); }}>
                            <Text style={[styles.timeoutButtonText, { color: '#fff' }]}>Tekrar Dene</Text>
                        </Pressable>
                    </View>
                </View>
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
                        <Text style={styles.title}>Giriş Yap</Text>
                        <TextInput
                            onChangeText={setNumaraInput}
                            placeholder="Telefon Numarası (5XXXXXXXXX)"
                            placeholderTextColor="#bbb"
                            keyboardType="phone-pad"
                            style={[styles.input, numaraFocus && styles.inputFocus]}
                            value={numaraInput}
                            onFocus={() => setNumaraFocus(true)}
                            onBlur={() => setNumaraFocus(false)}
                        />
                        <TextInput
                            onChangeText={setŞifreInput}
                            placeholder="Şifre (PIN)"
                            placeholderTextColor="#bbb"
                            keyboardType="numeric"
                            secureTextEntry={true}
                            style={[styles.input, şifreFocus && styles.inputFocus]}
                            value={şifreInput}
                            onFocus={() => setŞifreFocus(true)}
                            onBlur={() => setŞifreFocus(false)}
                        />
                        <Pressable
                            disabled={proccessing}
                            onPress={girişYap}
                            style={({ pressed }) => [
                                styles.button,
                                proccessing && styles.buttonDisabled,
                                pressed && !proccessing && styles.buttonPressed
                            ]}
                        >
                            {proccessing ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={styles.buttonText}>Giriş yapılıyor...</Text>
                                    <ActivityIndicator
                                        style={{ marginLeft: 10 }}
                                        animating={true}
                                        color="#fff"
                                        size="small"
                                    />
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Giriş</Text>
                            )}
                        </Pressable>
                        {/* Buton içinde gösterildiği için ekstra ActivityIndicator kaldırıldı */}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    solidBg: {
        flex: 1,
        backgroundColor: '#fff8f6',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        maxWidth: 350,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#bbb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 8,
    },
    logo: {
        width: 64,
        height: 64,
        marginBottom: 18,
        borderRadius: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#c62828',
        marginBottom: 24,
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        color: '#263238',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputFocus: {
        borderBottomColor: '#e57373',
    },
    button: {
        width: '100%',
        backgroundColor: '#e53935',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#bbb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    },
    buttonDisabled: {
        backgroundColor: '#ffd6d6',
    },
    buttonPressed: {
        backgroundColor: '#c62828',
    },
    timeoutPanel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    timeoutTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#c62828',
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    timeoutText: {
        fontSize: 16,
        color: '#263238',
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
    timeoutButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#e57373',
    },
    timeoutButtonText: {
        color: '#c62828',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

