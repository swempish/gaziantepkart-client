import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  Alert,
  Animated,
  Easing,
  Linking // Ayarlara yönlendirmek için
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const themeColors = {
  primary: '#1976D2',
  secondary: '#43A047',
  background: '#F0F4F8',
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#FFC107',
  error: '#D32F2F',
};

// QR Okuyucu Arayüzü
const QRCodeScannerUI = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const router = useRouter();

  // Animasyon için
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Ekran her odaklandığında izinleri kontrol et ve tarama durumunu sıfırla
  useFocusEffect(
    useCallback(() => {
      setScanned(false); // Ekrana geri dönüldüğünde tekrar tarama yapabilmek için
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();

      // Animasyonu başlat
      startScanAnimation();

      return () => {
        // Ekrandan ayrılırken animasyonu durdur
        scanAnimation.stopAnimation();
      };
    }, [])
  );

  const startScanAnimation = () => {
    scanAnimation.setValue(0);
    Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const processScannedData = (data: string) => {
    const match = new URL(data).pathname.match(/\/(\d+)(?:$|\/)/);
    const durakKodu = match ? match[1] : null;

    if (data.includes("gaziulas") && durakKodu != null){
        router.push({
          pathname: '/durak/[stopId]',
          params: { stopId: durakKodu },
        });
    }
    else {
        Alert.alert(
          'Hata',
          `Durak bulunamadı. Lütfen doğru QR kodu okuttuğunuzdan emin olun.`,
          [{ text: 'Tamam', onPress: () => setScanned(false) }] // Tekrar taramaya izin ver
        );
    }
  };
  
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return; // Eğer zaten bir kod okunduysa tekrar tetiklenmesin
    setScanned(true);
    processScannedData(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Kamera izni isteniyor...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Kamera erişimi için izin verilmedi.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionButtonText}>Ayarları Aç</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Animasyonlu çizginin dikey pozisyonunu hesapla
  const scanLineY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240], // 250 (viewfinder yüksekliği) - 10 (çizgi yüksekliği)
  });

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        enableTorch={torchOn ? true : false}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedArea} />

        <View style={styles.focusedRow}>
          <View style={styles.unfocusedArea} />
          {/* Tarama Alanı */}
          <View style={styles.viewfinder}>
             {/* Köşeler */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animasyonlu Tarama Çizgisi */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
          </View>
          <View style={styles.unfocusedArea} />
        </View>

        {/* Alt Karartma ve Bilgi Metni */}
        <View style={[styles.unfocusedArea, { alignItems: 'center', justifyContent: 'center' }]}>
           <Text style={styles.infoText}>QR kodu tarama alanına hizalayın</Text>
        </View>
      </View>

      {/* El feneri butonu */}
      <TouchableOpacity 
        style={styles.torchButton} 
        onPress={() => setTorchOn(prev => !prev)}
      >
        <MaterialCommunityIcons 
          name={torchOn ? "flashlight-off" : "flashlight"} 
          size={32} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
};


export default function AkilliDurakScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{ 
          title: 'Akıllı Durak',
          headerStyle: { backgroundColor: themeColors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <QRCodeScannerUI />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  // İzin ekranları için stiller
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // QR Okuyucu stilleri
  scannerContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    flex: 1,
  },
  unfocusedArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  focusedRow: {
    flexDirection: 'row',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: -100, // Bilgi metnini biraz yukarı taşı
  },
  torchButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: 15,
  },
});