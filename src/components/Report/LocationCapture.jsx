import React, { useState, useEffect } from 'react';
import { MapPin, Map as MapIcon, Loader2, AlertTriangle } from 'lucide-react';

const LocationCapture = ({ onLocationFound }) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchAddress = async (lat, lon) => {
        try {
            const response = await fetch(`/api/representatives/complete?lat=${lat}&lng=${lon}`);
            const data = await response.json();

            if (!data || data.error) throw new Error(data.error || "Failed to fetch location data");

            const locData = {
                lat,
                lng: lon,
                address: data.location.display_address,
                ward: data.representatives.enriched_jurisdiction?.local_body_panchayat_ward || data.location.address_components.ward || "Unknown Ward",
                city: data.location.address_components.city || data.location.address_components.town,
                state: data.location.address_components.state,
                municipality: data.representatives.enriched_jurisdiction?.municipality_corporation,
                zone: data.representatives.ward_details?.Zone,
                mp: data.representatives.enriched_electoral?.mp?.name,
                mla: data.representatives.enriched_electoral?.mla?.name,
                dist: data.representatives.enriched_jurisdiction?.district_zila_parishad
            };

            setLocation(locData);
            setLoading(false);

            if (onLocationFound) {
                onLocationFound(locData);
            }
        } catch (err) {
            console.error("Location enrichment error: ", err);
            // Fallback to basic coordinates if backend fails
            const fallback = { lat, lng: lon, address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, ward: "Unknown" };
            setLocation(fallback);
            setLoading(false);
            if (onLocationFound) onLocationFound(fallback);
        }
    };

    const getLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchAddress(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                setLoading(false);
                setError("Unable to retrieve your location. Please ensure location services are enabled.");
                console.error("Geolocation error:", error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        // We don't auto-fetch anymore to give user control
        // User must click a button or it's triggered externally
    }, []);

    return (
        <div className="w-full">
            {!location && !loading && !error && (
                <button
                    onClick={getLocation}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-200"
                >
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Detect My Location</span>
                </button>
            )}

            {loading && (
                <div className="w-full bg-primary-50 text-primary-700 py-4 px-4 rounded-lg flex items-center justify-center gap-3 border border-primary-100">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Acquiring precise GPS & checking addresses...</span>
                </div>
            )}

            {error && (
                <div className="w-full bg-red-50 text-red-700 py-4 px-4 rounded-lg flex flex-col gap-2 border border-red-200">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="font-medium text-sm">{error}</p>
                    </div>
                    <button
                        onClick={getLocation}
                        className="self-end text-xs font-bold uppercase tracking-wide bg-red-100 px-3 py-1.5 rounded hover:bg-red-200"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {location && !loading && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 text-sm">Location Verified</h4>
                            <p className="text-slate-600 text-sm mt-1 mb-2 line-clamp-2">{location.address}</p>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white px-2 py-1 rounded border border-slate-200">
                                    <span className="text-slate-400 block mb-0.5">Ward / Area</span>
                                    <span className="font-medium text-slate-700 truncate block" title={location.ward}>{location.ward} {location.zone ? `(${location.zone})` : ''}</span>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-200">
                                    <span className="text-slate-400 block mb-0.5">MP / MLA</span>
                                    <span className="font-medium text-slate-700 truncate block" title={`${location.mp} / ${location.mla}`}>
                                        {location.mp || 'N/A'} / {location.mla || 'N/A'}
                                    </span>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-200">
                                    <span className="text-slate-400 block mb-0.5">Municipality</span>
                                    <span className="font-medium text-slate-700 truncate block" title={location.municipality}>{location.municipality || location.city}</span>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-200">
                                    <span className="text-slate-400 block mb-0.5">Coordinates</span>
                                    <span className="font-mono text-slate-700">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationCapture;
