import { Image, StyleSheet, Platform, View, Text } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/gaziantep.jpg')}
          style={{resizeMode: 'cover', height: 250, width: '100%'}}
        />
      }>

      <Text style={{color: 'white', textAlign: 'left', fontWeight: 'bold', fontSize: 24}}>Gaziantep Kart</Text>
      
    </ParallaxScrollView>
  );
}
