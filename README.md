![GitHub last commit](https://img.shields.io/github/last-commit/swempish/gaziantepkart-client) ![GitHub License](https://img.shields.io/github/license/swempish/gaziantepkart-client) ![GitHub Release](https://img.shields.io/github/v/release/swempish/gaziantepkart-client)
 ![GitHub Repo stars](https://img.shields.io/github/stars/swempish/gaziantepkart-client)



# Gaziantep Kart Client

Bu proje, Gaziantep Kart sistemini kullanarak bakiye sorgulama, son kullanımları görüntüleme, bakiye bazlı kalan kullanım hesaplama ve duyuruları görüntüleme gibi özellikler sunan bir React Native Expo uygulamasıdır.

**⚠️ UYARI:** Bu proje eğitim ve kişisel kullanım amaçlı olarak geliştirilmiştir. Herhangi bir yasa dışı kullanım durumunda sorumluluk kabul edilmemektedir.

## İçindekiler

- [Özellikler](#özellikler)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Yapılacaklar](#yapılacaklar)
- [Lisans](#lisans)

## Özellikler

- [x] Bakiye sorgulama
- [x] Tarifeler listesi
- [x] Giriş yapma
- [x] Son kullanımları görüntüleme
- [x] Kalan kullanım hesaplama
- [x] Duyuruları görüntüleme

## Gereksinimler

- Node.js (v14 veya daha yeni)
- Expo CLI
- Android Studio (Emulator için)

## Kurulum

1. Bu repoyu klonlayın:
    ```bash
    git clone https://github.com/swempish/gaziantepkart-client.git
    cd gaziantepkart-client
    ```
2. Gerekli bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
3. `kentkart.com` sitesinde hesabınıza giriş yapın ve tarayıcının geliştirici seçeneklerinden API token'ınızı bulun. (İleride doğrudan giriş sistemi eklenecektir.)
4. Bir `.env` dosyası oluşturun ve şu şekilde API token'ınızı kaydedin:
    ```env
    EXPO_PUBLIC_API_TOKEN=your_token_here
    ```
5. Expo projeyi başlatın:
    ```bash
    npx expo start
    ```

## Kullanım

- Uygulamaya girip ilgili kısma kart numaranızı yazarak bakiye ve kullanım bilgilerinizi görüntüleyebilirsiniz.

## Yapılacaklar

- [ ] Giriş sistemi ekleme
- [ ] Kart kaydetme
- [ ] Kart'ı favoriye ekleme
- [ ] Kullanıcı dostu arayüz ve tasarım iyileştirmeleri

## Lisans

Bu proje **GNU Genel Kamu Lisansı (GPL) v3** altında lisanslanmıştır. Bu lisans altında kodu özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz. Ancak, aşağıdaki şartlara uymanız gerekmektedir:

1. **Aynı Lisansla Paylaşım**: Değiştirdiğiniz veya türettiğiniz kodları da GPL v3 lisansıyla paylaşmalısınız.
2. **Kaynak Kodunun Açıklanması**: Dağıttığınız kodun kaynak kodunu ve yapılan değişiklikleri sağlamalısınız.
3. **Telif Hakkı ve Lisans Notları**: Projeyi kullanırken ve dağıtırken orijinal telif hakkı ve lisans notlarını korumalısınız.

Projeyi kullanırken, orijinal yazar **Emirhan Çolak** ([GitHub: swempish](https://github.com/swempish))'a atıfta bulunmanız önerilir.

Lisansın tam metnini [buradan](./LICENSE) görüntüleyebilirsiniz.

