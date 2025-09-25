import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function DurakDetayScreen() {
  const { stopId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  // Navigation başlığını durak adıyla güncelle
  useLayoutEffect(() => {
    if (data && data.stopInfo && data.stopInfo.busStopName) {
      navigation.setOptions({ title: data.stopInfo.busStopName });
    } else {
      navigation.setOptions({ title: 'Durak Detayı' });
    }
  }, [data, navigation]);

  useEffect(() => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    fetch(
      `https://service.kentkart.com/rl1/web/nearest/bus?region=028&lang=tr&authType=4&accuracy=0&lat=0&lng=0&busStopId=${stopId}`,
      {
        credentials: 'omit',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
          'Content-Type': 'application/json',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Priority: 'u=0',
        },
        referrer: 'https://online.gaziantepkart.com.tr/',
        method: 'GET',
        mode: 'cors',
      }
    )
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('Veri alınamadı.');
        setLoading(false);
      });
  }, [stopId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 12, color: '#1976D2', fontWeight: 'bold' }}>Yükleniyor...</Text>
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{error || 'Durak bulunamadı.'}</Text>
      </View>
    );
  }

  const stopInfo = data.stopInfo;
  const busList = data.busList || [];
  const routeList = data.routeList || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{stopInfo.busStopName}</Text>
      <Text style={styles.subtitle}>ID: {stopInfo.busStopid}</Text>
      <Text style={styles.sectionTitle}>Durağa Yaklaşan Otobüsler</Text>
      {busList.length === 0 ? (
        <Text style={styles.info}>Şu anda yaklaşan otobüs yok.</Text>
      ) : (
        <FlatList
          data={busList}
          keyExtractor={(item) => item.busId}
          renderItem={({ item }) => (
            <View style={styles.busCard}>
              <Text style={styles.busLabel}>{item.displayRouteCode} - {item.headSign}</Text>
              <Text style={styles.busPlate}>{item.plate}</Text>
              <Text style={styles.busInfo}>Kalan Durak: {item.stopDiff} | Kalan Dakika: {item.timeDiff}</Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        />
      )}
      <Text style={styles.sectionTitle}>Bu Durağa Uğrayan Hatlar</Text>
      {routeList.length === 0 ? (
        <Text style={styles.info}>Hat bilgisi yok.</Text>
      ) : (
        <FlatList
          data={routeList}
          keyExtractor={(item) => item.routeCode}
          renderItem={({ item }) => (
            <View style={styles.routeCard}>
              <Text style={styles.routeLabel}>{item.displayRouteCode} - {item.headSign}</Text>
              <Text style={styles.routeTime}>Sonraki Varış: {item.nextTripArrivalTime || '-'}</Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7FAFC',
    minHeight: '100%',
    paddingBottom: 48,
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  info: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 220,
    shadowColor: '#1976D2',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  busLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 4,
    textAlign: 'center',
  },
  busPlate: {
    fontSize: 15,
    color: '#222',
    backgroundColor: '#e3e8ef',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  busInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: 200,
    shadowColor: '#43A047',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  routeLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#43A047',
    marginBottom: 2,
    textAlign: 'center',
  },
  routeTime: {
    fontSize: 13,
    color: '#888',
  },
});
