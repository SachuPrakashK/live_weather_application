export interface WeatherResponse {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    current_units: any;
    current: {
        time: string;
        interval: number;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        precipitation: number;
        weather_code: number;
        wind_speed_10m: number;
    };
    hourly_units?: any;
    hourly?: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
        weather_code: number[];
    };
    daily_units: any;
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        sunrise?: string[];
        sunset?: string[];
        uv_index_max?: number[];
    };
}

export interface AQIResponse {
    hourly: {
        time: string[];
        pm10: number[];
        pm2_5: number[];
        carbon_monoxide: number[];
        nitrogen_dioxide: number[];
        us_aqi: number[];
    }
}

export interface WeatherCondition {
    description: string;
    icon: string;
}

export interface FavoriteCity {
    id: number;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
}
