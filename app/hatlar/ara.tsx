import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Türkçe karakterleri normalize eden fonksiyon
function normalize(str: string) {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type Hat = {
  routeCode: string;
  displayRouteCode: string;
  name: string;
  routeColor?: string;
  routeTextColor?: string;
};


export default function HatlarAra() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hatlar, setHatlar] = useState<Hat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(
      'https://service.kentkart.com/rl1/web/nearest/find?region=028&authType=4&version=Web_2.0.7(27)_1.0_FIREFOX_kentkart.web.gaziantepkart&lang=tr&keyword='
    )
      .then((res) => res.json())
      .then((data) => {
        setHatlar(data.routeList || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounce arama
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(handler);
  }, [query]);

  const filtered = React.useMemo(() => {
    const nq = normalize(debouncedQuery);
    return hatlar.filter(
      h =>
        normalize(h.displayRouteCode).includes(nq) ||
        normalize(h.name).includes(nq)
    );
  }, [debouncedQuery, hatlar]);

  const renderItem = useCallback(
    ({ item }: { item: Hat }) => (
      <HatItem item={item} onPress={() => router.push(`/hatlar/${item.displayRouteCode}`)} />
    ),
    [router]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 12, color: '#1976D2', fontWeight: 'bold' }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hat Ara</Text>
      <TextInput
        style={styles.input}
        placeholder="Hat kodu veya isimle ara (örn: B01, Gazikent)"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.routeCode}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Sonuç bulunamadı. Lütfen farklı bir anahtar kelime deneyin.</Text>}
        style={{ width: '100%' }}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
}

type HatItemProps = {
  item: Hat;
  onPress: () => void;
};

const HatItem = memo(({ item, onPress }: HatItemProps) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Ionicons name="bus" size={22} color="#1976D2" style={{ marginRight: 10 }} />
    <View>
      <Text style={styles.kod}>{item.displayRouteCode}</Text>
      <Text style={styles.isim}>{item.name}</Text>
    </View>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 18,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E3E8EF',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1976D2',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  kod: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  isim: {
    fontSize: 15,
    color: '#333',
    opacity: 0.85,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
});
