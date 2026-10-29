export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  formattedAddress?: string;
}

export async function getCurrentCoordinates(): Promise<GeoLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let formattedAddress = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

        try {
          // Attempt reverse geocoding using free OpenStreetMap Nominatim endpoint
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'TrinityFitnessCRM/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              formattedAddress = data.display_name.split(',').slice(0, 3).join(', ');
            }
          }
        } catch {
          // Fallback to coordinates string if network/CORS blocks
        }

        resolve({
          latitude,
          longitude,
          accuracy,
          formattedAddress,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

