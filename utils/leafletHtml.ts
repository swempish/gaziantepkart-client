// Returns HTML string for Leaflet map with route, buses, stops, and user location
export function getLeafletHtml(params: {
  routeCoordinates: { latitude: number; longitude: number }[];
  busList: any[];
  stopList: any[];
  userLocation: { latitude: number; longitude: number } | null;
  mapCenter: { lat: number; lng: number; zoom: number };
}) {
  const { routeCoordinates, busList, stopList, userLocation, mapCenter } = params;
  const polyline = JSON.stringify(routeCoordinates.map((p) => [p.latitude, p.longitude]));
  const busMarkers = busList.map((bus) => `L.marker([${bus.lat},${bus.lng}],{icon:busIcon}).bindPopup('${bus.plateNumber}').addTo(map);`).join('\n');
  const stopMarkers = stopList.map((stop) => `L.marker([${stop.lat},${stop.lng}],{icon:stopIcon}).bindPopup('${stop.stopName}').addTo(map);`).join('\n');
  const userMarker = userLocation ? `L.marker([${userLocation.latitude},${userLocation.longitude}],{icon:userIcon}).bindPopup('Siz').addTo(map);` : '';
  return `<!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;padding:0;} #map{border-radius:16px;}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map').setView([${mapCenter.lat},${mapCenter.lng}], ${mapCenter.zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);
      var busIcon = L.icon({iconUrl:'data:image/png;base64,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',iconSize:[36,36], iconAnchor:[18,36], popupAnchor:[0,-28], className:'bus-marker'});
      var stopIcon = L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',iconSize:[28,28]});
      var userIcon = L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/149/149071.png',iconSize:[28,28]});
      var polyline = L.polyline(${polyline}, {color:'#FF6600',weight:4}).addTo(map);
      ${busMarkers}
      ${stopMarkers}
      ${userMarker}
      map.fitBounds(polyline.getBounds(),{padding:[20,20]});

      // WebView'dan gelen mesajı dinle (React Native -> Leaflet)
      function handleMessage(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === 'zoomToBus' && typeof data.lat === 'number' && typeof data.lng === 'number') {
            map.setView([data.lat, data.lng], 17, { animate: true });
          }
        } catch (e) {}
      }
      // Android/iOS WebView
      document.addEventListener('message', handleMessage);
      // iOS WebView (window.ReactNativeWebView)
      window.addEventListener('message', handleMessage);
    </script>
  </body>
  </html>`;
}