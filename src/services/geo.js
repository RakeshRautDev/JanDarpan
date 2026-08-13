import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

let pcGeoJson = null;

// Load GeoJSON once at runtime
const loadGeoData = async () => {
    if (pcGeoJson) return pcGeoJson;
    try {
        // Fetch from the public directory (copied via vite-plugin-static-copy)
        const response = await fetch('/data/constituencies.geojson');
        pcGeoJson = await response.json();
        return pcGeoJson;
    } catch (error) {
        console.error("Failed to load map data:", error);
        return null;
    }
};

export const getLocationData = async (lat, lng) => {
    try {
        const pt = point([lng, lat]);
        const data = await loadGeoData();

        let pcResult = null;
        if (data && data.features) {
            for (const feature of data.features) {
                if (booleanPointInPolygon(pt, feature)) {
                    pcResult = feature.properties;
                    break;
                }
            }
        }

        return {
            parliamentary: pcResult ? {
                pc_id: pcResult.pc_id,
                pc_name: pcResult.pc_name,
                state: pcResult.st_name
            } : null,
            assembly: null
        };
    } catch (error) {
        console.error("Geo mapping error:", error);
        return { parliamentary: null, assembly: null };
    }
};

// Haversine formula to calculate distance between two coordinates in meters
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

// Check if user is within a certain radius to perform an action
export const verifyGeofence = async (targetLat, targetLng, maxDistanceMeters = 5000) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const distance = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    targetLat,
                    targetLng
                );

                if (distance <= maxDistanceMeters) {
                    resolve({ allowed: true, distanceInMeters: distance });
                } else {
                    reject(new Error(`You are ${(distance / 1000).toFixed(1)}km away. You must be within ${maxDistanceMeters / 1000}km to verify this issue.`));
                }
            },
            (err) => {
                reject(new Error("Location access denied or unavailable. You must allow location to verify local issues."));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
};
