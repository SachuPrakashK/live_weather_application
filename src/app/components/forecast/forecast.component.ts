import { Component, Input, OnChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WeatherResponse, WeatherCondition } from '../../models/weather.model';
import { WeatherService } from '../../services/weather.service';

interface DailyForecast {
  date: Date;
  minTemp: number;
  maxTemp: number;
  condition: WeatherCondition;
}

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './forecast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForecastComponent implements OnChanges {
  @Input() weatherData: WeatherResponse | null = null;
  @Input() isLoading = false;

  private weatherService = inject(WeatherService);

  forecastDays = signal<DailyForecast[]>([]);

  ngOnChanges() {
    if (this.weatherData && this.weatherData.daily) {
      const daily = this.weatherData.daily;
      const days: DailyForecast[] = [];

      // Usually includes today + 6 next days
      for (let i = 0; i < daily.time.length; i++) {
        if (i >= 7) break; // Ensure only 7 days

        days.push({
          date: new Date(daily.time[i] + 'T00:00:00'),
          minTemp: daily.temperature_2m_min[i],
          maxTemp: daily.temperature_2m_max[i],
          condition: this.weatherService.getWeatherCondition(daily.weather_code[i], true) // Always use day config for forecast
        });
      }

      this.forecastDays.set(days);
    }
  }
}
