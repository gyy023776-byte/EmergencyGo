// Dynamic loader for Google Maps JavaScript API
let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
    return Promise.resolve((window as any).google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if ((window as any).google && (window as any).google.maps) {
        resolve((window as any).google);
      } else {
        reject(new Error('Google Maps SDK loaded but google.maps namespace is missing'));
      }
    };

    script.onerror = (err) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps SDK script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
