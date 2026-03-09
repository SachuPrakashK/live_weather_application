import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { City, GeocodingResponse } from '../models/city.model';
import { WeatherResponse, WeatherCondition } from '../models/weather.model';

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private http = inject(HttpClient);

    private readonly kearalaDefault: City = {
        id: 1264527,
        name: 'Kerala',
        latitude: 10.8505,
        longitude: 76.2711,
        elevation: 0,
        feature_code: 'ADM1',
        country_code: 'IN',
        timezone: 'Asia/Kolkata',
        country_id: 1269750,
        country: 'India',
        admin1: 'Kerala'
    };

    private selectedCitySubject = new BehaviorSubject<City | null>(null);
    selectedCity$ = this.selectedCitySubject.asObservable();

    constructor() {
        this.loadLastSearch();
    }

    private loadLastSearch() {
        // Always load Kerala default when the application starts or refreshes
        this.selectedCitySubject.next(this.kearalaDefault);
    }

    resetToDefault() {
        this.selectedCitySubject.next(this.kearalaDefault);
    }

    setSelectedCity(city: City) {
        this.selectedCitySubject.next(city);
    }

    searchCities(query: string): Observable<City[]> {
        if (!query.trim()) return of([]);

        const url = `${environment.geocodingApiUrl}/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
        return this.http.get<GeocodingResponse>(url).pipe(
            map(res => res.results || []),
            catchError(() => of([]))
        );
    }

    getWeather(lat: number, lon: number): Observable<WeatherResponse> {
        const url = `${environment.weatherApiUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

        return this.http.get<WeatherResponse>(url).pipe(
            shareReplay(1)
        );
    }

    getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
        const conditions: Record<number, { dayConfig: WeatherCondition, nightConfig?: WeatherCondition }> = {
            0: { dayConfig: { description: 'Clear sky', icon: '☀️' }, nightConfig: { description: 'Clear sky', icon: '🌕' } },
            1: { dayConfig: { description: 'Mainly clear', icon: '🌤️' }, nightConfig: { description: 'Mainly clear', icon: '✨' } },
            2: { dayConfig: { description: 'Partly cloudy', icon: '⛅' }, nightConfig: { description: 'Partly cloudy', icon: '☁️' } },
            3: { dayConfig: { description: 'Overcast', icon: '☁️' } },
            45: { dayConfig: { description: 'Fog', icon: '🌫️' } },
            48: { dayConfig: { description: 'Depositing rime fog', icon: '🌫️' } },
            51: { dayConfig: { description: 'Light drizzle', icon: '🌧️' } },
            53: { dayConfig: { description: 'Moderate drizzle', icon: '🌧️' } },
            55: { dayConfig: { description: 'Dense drizzle', icon: '🌧️' } },
            56: { dayConfig: { description: 'Light freezing drizzle', icon: '🌧️' } },
            57: { dayConfig: { description: 'Dense freezing drizzle', icon: '🌧️' } },
            61: { dayConfig: { description: 'Slight rain', icon: '🌦️' } },
            63: { dayConfig: { description: 'Moderate rain', icon: '🌧️' } },
            65: { dayConfig: { description: 'Heavy rain', icon: '🌧️' } },
            66: { dayConfig: { description: 'Light freezing rain', icon: '🌨️' } },
            67: { dayConfig: { description: 'Heavy freezing rain', icon: '🌨️' } },
            71: { dayConfig: { description: 'Slight snow fall', icon: '🌨️' } },
            73: { dayConfig: { description: 'Moderate snow fall', icon: '❄️' } },
            75: { dayConfig: { description: 'Heavy snow fall', icon: '❄️' } },
            77: { dayConfig: { description: 'Snow grains', icon: '🌨️' } },
            80: { dayConfig: { description: 'Slight rain showers', icon: '🌦️' } },
            81: { dayConfig: { description: 'Moderate rain showers', icon: '🌧️' } },
            82: { dayConfig: { description: 'Violent rain showers', icon: '⛈️' } },
            85: { dayConfig: { description: 'Slight snow showers', icon: '🌨️' } },
            86: { dayConfig: { description: 'Heavy snow showers', icon: '❄️' } },
            95: { dayConfig: { description: 'Thunderstorm', icon: '⛈️' } },
            96: { dayConfig: { description: 'Thunderstorm with slight hail', icon: '⛈️' } },
            99: { dayConfig: { description: 'Thunderstorm with heavy hail', icon: '⛈️' } },
        };

        const condition = conditions[code] || conditions[0];
        if (!isDay && condition.nightConfig) {
            return condition.nightConfig;
        }
        return condition.dayConfig;
    }
}
