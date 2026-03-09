import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../../components/search/search.component';
import { CurrentWeatherComponent } from '../../components/current-weather/current-weather.component';
import { ForecastComponent } from '../../components/forecast/forecast.component';
import { HourlyForecastComponent } from '../../components/hourly-forecast/hourly-forecast.component';
import { WeatherService } from '../../services/weather.service';
import { City } from '../../models/city.model';
import { WeatherResponse, AQIResponse } from '../../models/weather.model';
import { combineLatest, forkJoin, of, switchMap, catchError, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, SearchComponent, CurrentWeatherComponent, HourlyForecastComponent, ForecastComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
    public weatherService = inject(WeatherService);
    private destroy$ = new Subject<void>();

    city = signal<City | null>(null);
    weather = signal<WeatherResponse | null>(null);
    aqi = signal<AQIResponse | null>(null);
    isLoading = signal<boolean>(true);
    errorMsg = signal<string | null>(null);

    constructor() {
        combineLatest([
            this.weatherService.selectedCity$
        ]).pipe(
            switchMap(([city]) => {
                if (!city) return of(null);
                this.city.set(city);
                this.isLoading.set(true);
                this.errorMsg.set(null);

                return forkJoin({
                    weather: this.weatherService.getWeather(city.latitude, city.longitude).pipe(catchError(() => of(null))),
                    aqi: this.weatherService.getAQI(city.latitude, city.longitude).pipe(catchError(() => of(null)))
                });
            }),
            takeUntil(this.destroy$)
        ).subscribe(data => {
            if (data?.weather && data?.aqi) {
                this.weather.set(data.weather);
                this.aqi.set(data.aqi);
                this.isLoading.set(false);
                this.weatherService.updateBackground(data.weather.current.weather_code, data.weather.current.is_day === 1);
            } else if (data) {
                this.errorMsg.set('Failed to load complete weather data. Please try again.');
                this.isLoading.set(false);
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
