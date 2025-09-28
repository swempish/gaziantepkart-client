import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

interface TeknikBilgi {
    işletici: string;
    hatSayısı?: number;
    hatlar?: string[];
    araçTipleri: string;
    engelliErişimi: boolean | string;
    klima: boolean;
    seferAralıkları: string;
    çalışmaSaatleri: string;
    hatUzunluğu?: string;
    istasyonSayısı?: number;
}

interface Arac {
    ad: string;
    açıklama: string;
    teknikBilgi: TeknikBilgi;
    görselLinkleri: string[];
}

interface AracVerisi {
    [key: string]: Arac;
}

const DATA_URL = 'https://cdn.jsdelivr.net/gh/swempish/open-data@latest/gaziulas/araclar.json';
let aracVerisiCache: AracVerisi | null = null;

const COLORS = {
    primary: '#FF6F00',
    background: '#F7F8FA',
    card: '#FFFFFF',
    textPrimary: '#1A2533',
    textSecondary: '#6A737D',
    divider: '#EAECEF',
    iconBackground: '#F4F6F8',
    success: '#28a745',
    successBackground: '#E9F6EC',
    danger: '#dc3545',
    dangerBackground: '#F9EBEB',
};

const { width } = Dimensions.get('window');

const getIconForKey = (key: string) => {
    const size = 24;
    const color = COLORS.textSecondary;
    switch (key) {
        case 'işletici': return <MaterialCommunityIcons name="office-building-outline" size={size} color={color} />;
        case 'hatSayısı': return <MaterialCommunityIcons name="format-list-numbered" size={size} color={color} />;
        case 'hatlar': return <MaterialCommunityIcons name="road-variant" size={size} color={color} />;
        case 'araçTipleri': return <Feather name="truck" size={size} color={color} />;
        case 'engelliErişimi': return <MaterialCommunityIcons name="wheelchair-accessibility" size={size} color={color} />;
        case 'klima': return <MaterialCommunityIcons name="air-conditioner" size={size} color={color} />;
        case 'seferAralıkları': return <MaterialCommunityIcons name="timelapse" size={size} color={color} />;
        case 'çalışmaSaatleri': return <Feather name="clock" size={size} color={color} />;
        case 'hatUzunluğu': return <MaterialCommunityIcons name="map-marker-distance" size={size} color={color} />;
        case 'istasyonSayısı': return <MaterialCommunityIcons name="store-marker-outline" size={size} color={color} />;
        default: return <Feather name="info" size={size} color={color} />;
    }
};

// Anahtar isimlerini daha okunabilir hale getiren fonksiyon
const formatKey = (key: string) => {
    const formatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    // Özel durumlar için düzeltme
    if (formatted === "Hat Sayısı") return "Hat Sayısı";
    if (formatted === "Araç Tipleri") return "Araç Tipi";
    return formatted;
};

// Değerleri formatlayan fonksiyon
const formatValue = (value: any) => {
    if (Array.isArray(value)) return value.join(', ');
    return value;
};


// Teknik bilgi satırlarını oluşturacak olan bileşen
const InfoRow = ({ label, value, icon }: { label: string, value: any, icon: JSX.Element }) => {
    // Boolean (true/false) değerleri için özel gösterim
    if (typeof value === 'boolean') {
        const isAvailable = value;
        return (
            <View style={styles.infoRowContainer}>
                <View style={styles.infoIconContainer}>{icon}</View>
                <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{label}</Text>
                </View>
                <View style={[styles.statusPill, isAvailable ? styles.successPill : styles.dangerPill]}>
                    <Feather name={isAvailable ? "check-circle" : "x-circle"} size={14} color={isAvailable ? COLORS.success : COLORS.danger} />
                    <Text style={[styles.statusPillText, isAvailable ? styles.successPillText : styles.dangerPillText]}>
                        {isAvailable ? 'Var' : 'Yok'}
                    </Text>
                </View>
            </View>
        );
    }

    // Diğer tüm değerler için genel gösterim
    return (
        <View style={styles.infoRowContainer}>
            <View style={styles.infoIconContainer}>{icon}</View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{formatValue(value)}</Text>
            </View>
        </View>
    );
};
// ==========================================================

// ANA EKRAN BİLEŞENİ
// ==========================================================
const BilgiScreen = () => {
    const [seciliKategori, setSeciliKategori] = React.useState('Araçlar');
    const [aracVerisi, setAracVerisi] = React.useState<AracVerisi | null>(aracVerisiCache);
    const [loading, setLoading] = React.useState(!aracVerisiCache);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const veriCek = async () => {
            if (aracVerisiCache) return;
            try {
                const response = await fetch(DATA_URL);
                const data = await response.json();
                aracVerisiCache = data.araçKodları;
                setAracVerisi(data.araçKodları);
            } catch (e) {
                setError('Veriler yüklenirken bir hata oluştu.');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        veriCek();
    }, []);

    const renderAraclar = () => {
        if (!aracVerisi) return null;

        return (
            <View style={styles.listContainer}>
                {Object.entries(aracVerisi).map(([kod, arac]) => (
                    <View key={kod} style={styles.card}>
                        <Image source={{ uri: arac.görselLinkleri[0] }} style={styles.cardImage} />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{arac.ad}</Text>
                            <Text style={styles.cardDescription}>{arac.açıklama}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.cardContent}>
                            <Text style={styles.teknikBilgiTitle}>Teknik Özellikler</Text>
                            {Object.entries(arac.teknikBilgi).map(([key, value]) => (
                                <InfoRow
                                    key={key}
                                    label={formatKey(key)}
                                    value={value}
                                    icon={getIconForKey(key)}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Genel Bilgi Merkezi' }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Bilgi Merkezi</Text>
                    <Text style={styles.headerSubtitle}>Şehir ulaşımı hakkında merak ettikleriniz</Text>
                </View>

                <View style={styles.kategoriContainer}>
                    <TouchableOpacity
                        style={[styles.kategoriButton, seciliKategori === 'Araçlar' && styles.seciliKategoriButton]}
                        onPress={() => setSeciliKategori('Araçlar')}>
                        <Feather name="truck" size={20} color={seciliKategori === 'Araçlar' ? COLORS.card : COLORS.textPrimary} />
                        <Text style={[styles.kategoriText, seciliKategori === 'Araçlar' && styles.seciliKategoriText]}>
                            Araçlar
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />}
                {error && <Text style={styles.errorText}>{error}</Text>}
                {seciliKategori === 'Araçlar' && !loading && !error && renderAraclar()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    kategoriContainer: {
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    kategoriButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.divider,
        alignSelf: 'flex-start',
    },
    seciliKategoriButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    kategoriText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    seciliKategoriText: {
        color: COLORS.card,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.danger,
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: width * 0.55,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cardContent: {
        padding: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginHorizontal: 20,
    },
    teknikBilgiTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    
    infoRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.iconBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginTop: 2,
    },
    // Var/Yok durumunu gösteren etiket stilleri
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    statusPillText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    successPill: {
        backgroundColor: COLORS.successBackground,
    },
    successPillText: {
        color: COLORS.success,
    },
    dangerPill: {
        backgroundColor: COLORS.dangerBackground,
    },
    dangerPillText: {
        color: COLORS.danger,
    },
});

export default BilgiScreen;