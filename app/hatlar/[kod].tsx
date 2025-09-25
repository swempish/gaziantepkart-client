import React, { useLayoutEffect, useEffect, useRef, useState, memo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getLeafletHtml } from '../../utils/leafletHtml';
import { TextInput } from 'react-native-gesture-handler';

const themeColors = {
  primary: '#1976D2',
  secondary: '#43A047',
  background: '#F0F4F8',
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#FFC107',
  error: '#D32F2F',
  white: '#FFFFFF',
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedBusCoord, setSelectedBusCoord] = useState<{lat: number, lng: number} | null>(null);
  const webViewRef = useRef<any>(null);
  const router = useRouter();
  const [direction, setDirection] = useState(1);

  const toggleDirection = () => {
    setDirection(prevDirection => (prevDirection === 1 ? 0 : 1));
  };
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

  // Otobüs konumlarını periyodik olarak güncelle
  useEffect(() => {
    if (!webViewRef.current || !data?.pathList?.[0]) return;

    const fetchBusLocations = async () => {
      try {
        const res = await fetch(
          `https://service.kentkart.com/rl1/web/pathInfo?region=028&lang=tr&authType=4&direction=${direction}&displayRouteCode=${encodeURIComponent(String(kod))}&resultType=111111`,
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json?.pathList?.[0]?.busList) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'updateBuses',
            buses: json.pathList[0].busList
          }));
        }
      } catch (e) {
        console.error('Error fetching bus locations:', e);
      }
    };

    // Her 6 saniyede bir güncelle
    intervalRef.current = setInterval(fetchBusLocations, 6000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [kod, direction, webViewRef.current]);

  // API'den veri çek
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://service.kentkart.com/rl1/web/pathInfo?region=028&lang=tr&authType=4&direction=${direction}&displayRouteCode=${encodeURIComponent(String(kod))}&resultType=111111`,
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
  }, [kod, direction]);

  useEffect(() => {
    if (data?.pathList?.[0]?.busStopList) {
      setFilteredStops(data.pathList[0].busStopList);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [direction]);

  // Arama sorgusu değiştikçe durakları filtrele
  useEffect(() => {
    if (data?.pathList?.[0]?.busStopList) {
      if (searchQuery.trim() === '') {
        setFilteredStops(data.pathList[0].busStopList);
      } else {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = data.pathList[0].busStopList.filter((stop: Stop) =>
          stop.stopName.toLowerCase().includes(lowercasedQuery)
        );
        setFilteredStops(filtered);
      }
    }
  }, [searchQuery, data]);

  // --- HOOKS SONU ---

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 12, color: themeColors.primary, fontWeight: 'bold' }}>Yükleniyor...</Text>
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

  // WebView'dan gelen mesajları işle
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigateToStop' && data.stopId) {
        router.push({
          pathname: '/durak/[stopId]',
          params: { stopId: data.stopId },
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
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
      <StatusBar backgroundColor={themeColors.primary} style="light" />
      <ScrollView contentContainerStyle={styles.container} scrollEnabled={scrollEnabled}>
        <View style={styles.headerContainer}>
          <View style={[styles.routeBadge, { backgroundColor: path.routeColor ? `#${path.routeColor}` : themeColors.primary }]}>
            <Text style={[styles.routeBadgeText, { color: path.routeTextColor ? `#${path.routeTextColor}` : themeColors.white }]}>{path.displayRouteCode}</Text>
          </View>
          <Text style={styles.isim}>{path.headSign}</Text>
          {path.tripShortName && (
            <Text style={styles.aciklama}>{path.tripShortName}</Text>
          )}
          <TouchableOpacity style={styles.directionButton} onPress={toggleDirection}>
            <Ionicons name="swap-horizontal" size={20} color={themeColors.white} />
            <Text style={styles.directionButtonText}>Yön Değiştir</Text>
          </TouchableOpacity>
        </View>

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
              mapCenter,
            }) }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            onMessage={handleWebViewMessage}
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
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Durak adı ara..."
                placeholderTextColor={themeColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredStops}
              keyExtractor={(item) => item.stopId}
              renderItem={({ item }) => <StopCard stop={item} />}
              scrollEnabled={false} // Ana ScrollView kaydıracağı için
              contentContainerStyle={{ gap: 12 }}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>
                    Aramanızla eşleşen durak bulunamadı.
                  </Text>
                </View>
              }
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
        <MaterialCommunityIcons name="bus" size={32} color={themeColors.primary} />
      </View>
      <View style={styles.busCardInfo}>
        <Text style={styles.busLabel} numberOfLines={1}>{bus.busLabel}</Text>
        <View style={styles.busPlateRow}>
          <Text style={styles.busPlate}>{bus.plateNumber}</Text>
        </View>
      </View>
    </View>
    <View style={styles.busInfoContainer}>
      {bus.disabledPerson === '1' && (
        <View style={styles.busInfoChip}>
          <FontAwesome5 name="wheelchair" size={14} color={themeColors.textSecondary} />
          <Text style={styles.busInfoText}>Erişilebilir</Text>
        </View>
      )}
      {bus.ac === '1' && (
        <View style={styles.busInfoChip}>
          <MaterialCommunityIcons name="air-conditioner" size={16} color={themeColors.textSecondary} />
          <Text style={styles.busInfoText}>Klimalı</Text>
        </View>
      )}
      {bus.bike === '1' && (
        <View style={styles.busInfoChip}>
          <Ionicons name="bicycle" size={16} color={themeColors.textSecondary} />
          <Text style={styles.busInfoText}>Bisikletli</Text>
        </View>
      )}
    </View>
    <TouchableOpacity style={styles.showOnMapBtn} onPress={() => onShowOnMap(bus)}>
        <Ionicons name="location-sharp" size={18} color={themeColors.primary} />
        <Text style={styles.showOnMapText}>Haritada Göster</Text>
    </TouchableOpacity>
  </View>
));


const StopCard = memo(({ stop }: { stop: Stop }) => {
  const router = useRouter();
  const handlePress = () => {
    router.push({
      pathname: '/durak/[stopId]',
      params: { stopId: stop.stopId },
    });
  };
  return (
    <TouchableOpacity style={styles.stopCard} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.stopIconBox}>
        <MaterialCommunityIcons name="bus-stop" size={24} color={themeColors.secondary} />
      </View>
      <View style={styles.stopInfoContainer}>
        <Text style={styles.stopName} numberOfLines={2}>{stop.stopName}</Text>
        <Text style={styles.stopId}>Durak No: {stop.stopId}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: themeColors.background,
    minHeight: '100%',
    paddingBottom: 48,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: themeColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: themeColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  mapBox: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
    backgroundColor: themeColors.cardBackground,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: themeColors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  section: {
    width: '100%',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 12,
    paddingLeft: 8,
  },
  routeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  routeBadgeText: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  busCard: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    width: 280, 
    shadowColor: themeColors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
  },
  busCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIconBox: {
    backgroundColor: `${themeColors.primary}20`,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  busCardInfo: {
    flex: 1,
  },
  busLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: themeColors.textPrimary,
    marginBottom: 4,
  },
  busPlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busPlate: {
    fontSize: 14,
    color: themeColors.textPrimary,
    backgroundColor: themeColors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontWeight: 'bold',
  },
  busInfoContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  busInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  busInfoText: {
    marginLeft: 5,
    fontSize: 12,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  stopCard: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: themeColors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stopIconBox: {
    backgroundColor: `${themeColors.secondary}20`,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopInfoContainer: {
    flex: 1,
    marginRight: 8,
  },
  stopName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: themeColors.textPrimary,
    marginBottom: 2,
    textAlign: 'left',
  },
  showOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${themeColors.primary}20`,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  showOnMapText: {
    fontSize: 14,
    color: themeColors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopId: {
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: themeColors.textPrimary,
  },
  isim: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  aciklama: {
    fontSize: 14,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 16,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  directionButtonText: {
    color: themeColors.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background,
  },
  notFound: {
    fontSize: 18,
    color: themeColors.error,
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
