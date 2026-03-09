import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../../components/search/search.component';
import { CurrentWeatherComponent } from '../../components/current-weather/current-weather.component';
import { ForecastComponent } from '../../components/forecast/forecast.component';
import { WeatherService } from '../../services/weather.service';
import { City } from '../../models/city.model';
import { WeatherResponse } from '../../models/weather.model';
import { HttpClientModule } from '@angular/common/http';
import { switchMap, catchError, of, tap } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, SearchComponent, CurrentWeatherComponent, ForecastComponent, HttpClientModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
    private weatherService = inject(WeatherService);

    city = signal<City | null>(null);
    weather = signal<WeatherResponse | null>(null);
    isLoading = signal<boolean>(true);
    errorMsg = signal<string | null>(null);

    constructor() {
        // Listen to selected city changes
        this.weatherService.selectedCity$.subscribe(city => {
            if (city) {
                this.fetchWeatherData(city);
            }
        });
    }

    private fetchWeatherData(city: City) {
        this.city.set(city);
        this.isLoading.set(true);
        this.errorMsg.set(null);

        this.weatherService.getWeather(city.latitude, city.longitude)
            .pipe(
                tap(() => this.isLoading.set(false)),
                catchError(err => {
                    this.isLoading.set(false);
                    this.errorMsg.set('Failed to load weather data. Please try again later.');
                    return of(null);
                })
            )
            .subscribe(data => {
                if (data) {
                    this.weather.set(data);
                }
            });
    }
}
