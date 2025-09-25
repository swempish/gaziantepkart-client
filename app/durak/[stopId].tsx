import React, { useEffect, useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  SafeAreaView // Daha güvenli bir alan için
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
// Görsel zenginlik katmak için ikonları import ediyoruz
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 

// Tema renklerini bir obje olarak tanımlayalım, yönetmesi daha kolay olur.
const themeColors = {
  primary: '#1976D2',    // Ana Mavi
  secondary: '#43A047',  // Ana Yeşil
  background: '#F0F4F8', // Daha yumuşak bir arka plan
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#FFC107',     // Plaka gibi alanlar için dikkat çekici bir renk
  error: '#D32F2F',
};

export default function DurakDetayScreen() {
  const { stopId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useLayoutEffect(() => {
    if (data?.stopInfo?.busStopName) {
      navigation.setOptions({ title: data.stopInfo.busStopName });
    } else {
      navigation.setOptions({ title: 'Durak Detayı' });
    }
  }, [data, navigation]);

  useEffect(() => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    // API isteği ve diğer mantıklar aynı kalıyor...
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
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="bus-stop-uncovered" size={64} color={themeColors.error} />
        <Text style={styles.errorText}>{error || 'Durak bulunamadı.'}</Text>
      </View>
    );
  }

  const { stopInfo, busList = [], routeList = [] } = data;

  // Yaklaşan otobüsler için render item fonksiyonu
  const renderBusItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <FontAwesome name="bus" size={24} color={themeColors.primary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleContainer}>
          <View style={[styles.routeBadge, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.primary }]}>
            <Text style={[styles.routeBadgeText, { color: item.routeTextColor ? `#${item.routeTextColor}` : '#FFFFFF' }]}>{item.displayRouteCode}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
          {item.disabledPerson === '1' && (
            <FontAwesome name="wheelchair" size={18} color={themeColors.textPrimary} style={{ marginLeft: 8 }} />
          )}
        </View>
        <View style={styles.plateContainer}>
          <MaterialCommunityIcons name="card-account-details-outline" size={16} color={themeColors.textSecondary} />
          <Text style={styles.plateText}>{item.plate}</Text>
        </View>
      </View>
      <View style={styles.cardRightContent}>
        <Text style={styles.timeText}>{item.timeDiff}</Text>
        <Text style={styles.timeLabel}>dk</Text>
      </View>
    </View>
  );

  // Durağa uğrayan hatlar için render item fonksiyonu
  const renderRouteItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
       <View style={[styles.cardIconContainer, { backgroundColor: `${themeColors.secondary}20` }]}>
        <MaterialCommunityIcons name="routes" size={24} color={themeColors.secondary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleContainer}>
            <View style={[styles.routeBadge, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.secondary }]}>
                <Text style={[styles.routeBadgeText, { color: item.routeTextColor ? `#${item.routeTextColor}` : '#FFFFFF' }]}>{item.displayRouteCode}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
        </View>
      </View>
      <View style={styles.cardRightContentMinimal}>
        <Text style={styles.nextTripText}>Sonraki Varış: {item.nextTripArrivalTime || '-'}</Text>
      </View>
    </View>
  );

  // Bilgi bulunamadığında gösterilecek component
  const renderEmptyState = (message: string) => (
      <View style={styles.emptyStateContainer}>
        <MaterialCommunityIcons name="information-outline" size={24} color={themeColors.textSecondary} />
        <Text style={styles.emptyStateText}>{message}</Text>
      </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Durak Başlığı ve ID'si */}
        <View style={styles.header}>
          <Text style={styles.title}>{stopInfo.busStopName}</Text>
          <Text style={styles.subtitle}>Durak No: {stopInfo.busStopid}</Text>
        </View>

        {/* Bölüm Başlıkları ve Listeler */}
        <Text style={styles.sectionTitle}>Durağa Yaklaşan Otobüsler</Text>
        <FlatList
          data={busList}
          keyExtractor={(item) => item.busId.toString()}
          renderItem={renderBusItem}
          ListEmptyComponent={() => renderEmptyState("Şu anda durağa yaklaşan otobüs bulunmuyor.")}
          scrollEnabled={false} // ScrollView içinde olduğu için kendi scroll'unu kapattık
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />} // Kartlar arasına boşluk
        />

        <Text style={styles.sectionTitle}>Bu Duraktan Geçen Hatlar</Text>
        <FlatList
          data={routeList}
          keyExtractor={(item) => item.routeCode.toString()}
          renderItem={renderRouteItem}
          ListEmptyComponent={() => renderEmptyState("Bu duraktan geçen hat bilgisi bulunamadı.")}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: themeColors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: themeColors.error,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: themeColors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
    paddingLeft: 8,
  },
  card: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${themeColors.primary}20`, // %20 opacity ile mavi
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  routeBadgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
    flex: 1, 
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  plateText: {
    color: themeColors.textPrimary,
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  cardRightContent: {
    alignItems: 'center',
    marginLeft: 16,
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  timeLabel: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginTop: -4,
  },
  cardRightContentMinimal: {
    marginLeft: 16,
  },
  nextTripText: {
    fontSize: 13,
    color: themeColors.secondary,
    fontWeight: '600',
  },
  emptyStateContainer: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 15,
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
});