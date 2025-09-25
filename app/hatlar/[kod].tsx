import React, { useLayoutEffect, useEffect, useRef, useState, memo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getLeafletHtml } from '../../utils/leafletHtml';

type Bus = {
  busId: string;
  lat: string;
  lng: string;
  plateNumber: string;
  busLabel: string;
  disabledPerson: string;
  stopId: string;
  vehicleType: string;
  ac: string;
  bike: string;
};

type Stop = {
  stopId: string;
  stopName: string;
  lat: string;
  lng: string;
};

export default function HatDetayScreen() {
  // --- HOOKS: En üstte ve koşulsuz ---
  const { kod } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedBusCoord, setSelectedBusCoord] = useState<{lat: number, lng: number} | null>(null);
  const webViewRef = useRef<any>(null);

  // Kullanıcı konumu iste
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    })();
  }, []);

  // Başlık güncelle
  useLayoutEffect(() => {
    if (data && data.pathList && data.pathList[0]) {
      navigation.setOptions({
        title: `${data.pathList[0].displayRouteCode} - ${data.pathList[0].headSign}`,
      });
    } else {
      navigation.setOptions({ title: 'Hat Detayı' });
    }
  }, [data, navigation]);

  // API'den veri çek
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://service.kentkart.com/rl1/web/pathInfo?region=028&lang=tr&authType=4&direction=1&displayRouteCode=${encodeURIComponent(String(kod))}&resultType=111111`,
        {
          credentials: "omit",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3",
            "Content-Type": "application/json",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
          },
          referrer: "https://online.gaziantepkart.com.tr/",
          method: "GET",
          mode: "cors",
        }
      );
      if (!res.ok) throw new Error("API hatası");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [kod]);

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // --- HOOKS SONU ---

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 12, color: '#1976D2', fontWeight: 'bold' }}>Yükleniyor...</Text>
      </View>
    );
  }
  if (error || !data || !data.pathList || !data.pathList[0]) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{error || 'Hat bulunamadı.'}</Text>
      </View>
    );
  }

  const path = data.pathList[0];
  const busList: Bus[] = path.busList || [];
  const stopList: Stop[] = path.busStopList || [];
  // Harita için markerlar: araçlar ve duraklar
  const allMarkers = [
    ...busList.map((bus) => ({
      key: `bus-${bus.busId}`,
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      type: 'bus',
      data: bus,
    })),
    ...stopList.map((stop) => ({
      key: `stop-${stop.stopId}`,
      lat: parseFloat(stop.lat),
      lng: parseFloat(stop.lng),
      type: 'stop',
      data: stop,
    })),
  ];

  // Haritada göster fonksiyonu
  const handleShowOnMap = (bus: Bus) => {
    const lat = parseFloat(bus.lat);
    const lng = parseFloat(bus.lng);
    setSelectedBusCoord({ lat, lng });
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'zoomToBus', lat, lng }));
    }
  };

  // Rota noktaları (Polyline için)
  const pointListPolyline = path.pointList || [];
  const routeCoordinates: { latitude: number; longitude: number }[] = pointListPolyline.map((p: any) => ({
    latitude: parseFloat(p.lat),
    longitude: parseFloat(p.lng),
  }));


  // Harita merkezi: kullanıcı konumu varsa ona yakın başlat, yoksa rota/marker ortalaması
  let mapCenter = { lat: 37.0662, lng: 37.3833, zoom: 13 };
  if (userLocation) {
    mapCenter = { lat: userLocation.latitude, lng: userLocation.longitude, zoom: 15 };
  } else if (routeCoordinates.length > 1) {
    const avgLat = routeCoordinates.reduce((sum, p) => sum + p.latitude, 0) / routeCoordinates.length;
    const avgLng = routeCoordinates.reduce((sum, p) => sum + p.longitude, 0) / routeCoordinates.length;
    mapCenter = { lat: avgLat, lng: avgLng, zoom: 13 };
  } else if (allMarkers.length) {
    mapCenter = { lat: allMarkers[0].lat, lng: allMarkers[0].lng, zoom: 13 };
  }

  return (
    <>
      <StatusBar backgroundColor="#1976D2" style="light" />
  <ScrollView contentContainerStyle={styles.container} scrollEnabled={scrollEnabled}>
        <View style={styles.imageBox}>
          <Ionicons name="bus" size={64} color="#1976D2" />
        </View>
        <Text style={styles.kod}>{path.displayRouteCode}</Text>
        <Text style={styles.isim}>{path.headSign}</Text>
        {path.tripShortName ? (
          <Text style={styles.aciklama}>{path.tripShortName}</Text>
        ) : null}

        {/* Harita */}
        <View
          style={styles.mapBox}
          onTouchStart={() => setScrollEnabled(false)}
          onTouchEnd={() => setScrollEnabled(true)}
        >
          <WebView
            ref={webViewRef}
            style={styles.map}
            originWhitelist={["*"]}
            source={{ html: getLeafletHtml({
              routeCoordinates,
              busList,
              stopList,
              userLocation,
              mapCenter
            }) }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
          />
        </View>

        {/* Araçlar */}
        {busList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktif Araçlar</Text>
            <FlatList
              data={busList}
              keyExtractor={(item) => item.busId}
              renderItem={({ item }) => <BusCard bus={item} onShowOnMap={handleShowOnMap} />}
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
            />
          </View>
        )}

        {/* Duraklar */}
        {stopList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle }>Duraklar</Text>
            <FlatList
              data={stopList}
              keyExtractor={(item) => item.stopId}
              renderItem={({ item }) => <StopCard stop={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const BusCard = memo(({ bus, onShowOnMap }: { bus: Bus, onShowOnMap: (bus: Bus) => void }) => (
  <View style={styles.busCard}>
    <View style={styles.busCardRow}>
      <View style={styles.busIconBox}>
        <MaterialCommunityIcons name="bus" size={40} color="#1976D2" />
      </View>
      <View style={styles.busCardInfo}>
        <Text style={styles.busLabel}>{bus.busLabel}</Text>
        <View style={styles.busPlateRow}>
          <Text style={styles.busPlate}>{bus.plateNumber}</Text>
          {bus.disabledPerson === '1' && (
            <FontAwesome5 name="wheelchair" size={20} color="#1976D2" style={{ marginLeft: 8 }} />
          )}
        </View>
        {bus.ac === '1' && <Text style={styles.busInfo}>Klima: Var</Text>}
        {bus.bike === '1' && <Text style={styles.busInfo}>Bisiklet: Var</Text>}
      </View>
    </View>
    <TouchableOpacity style={styles.showOnMapBtn} onPress={() => onShowOnMap(bus)}>
        <Ionicons name="location-sharp" size={28} color="#1976D2" />
        <Text style={styles.showOnMapText}>Haritada Göster</Text>
    </TouchableOpacity>
  </View>
));


const StopCard = memo(({ stop }: { stop: Stop }) => {
  const router = useRouter();
  const handlePress = () => {
    router.push(`/durak/${stop.stopId}`);
  };
  return (
    <TouchableOpacity style={styles.stopCard} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.stopIconBox}>
        <MaterialCommunityIcons name="bus-stop" size={28} color="#43A047" />
      </View>
      <Text style={styles.stopName}>{stop.stopName}</Text>
      <Text style={styles.stopId}>ID: {stop.stopId}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7FAFC',
    minHeight: '100%',
    paddingBottom: 48,
  },
  mapBox: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    marginVertical: 18,
    backgroundColor: '#e3e8ef',
    borderWidth: 1,
    borderColor: '#e3e8ef',
    shadowColor: '#1976D2',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  section: {
    width: '100%',
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    marginLeft: 4,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'column',
    alignItems: 'center',
    width: 340,
    height: 180,
    shadowColor: '#1976D2',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
  },
  busCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIconBox: {
    backgroundColor: '#e3e8ef',
    borderRadius: 36,
    padding: 10,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  busLabel: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#1976D2',
    marginBottom: 4,
  },
  busPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  busPlate: {
    fontSize: 16,
    color: '#222',
    backgroundColor: '#e3e8ef',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  busInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  stopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: 140,
    shadowColor: '#43A047',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stopIconBox: {
    backgroundColor: '#e3f6e3',
    borderRadius: 24,
    padding: 6,
    marginBottom: 8,
  },
  stopName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#43A047',
    marginBottom: 2,
    textAlign: 'center',
  },
  showOnMapBtn: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  showOnMapText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: 'bold',
    marginTop: 2,
  },
  stopId: {
    fontSize: 13,
    color: '#888',
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: -8,
  },
  imageBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#1976D2',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  kod: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
    letterSpacing: 1,
  },
  isim: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  aciklama: {
    fontSize: 15,
    color: '#444',
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
  notFound: {
    fontSize: 18,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  debugBox: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
    fontSize: 13,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
