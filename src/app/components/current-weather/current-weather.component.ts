import { Component, Input, OnChanges, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WeatherResponse } from '../../models/weather.model';
import { City } from '../../models/city.model';
import { WeatherService } from '../../services/weather.service';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './current-weather.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentWeatherComponent implements OnChanges, OnDestroy {
  @Input() weatherData: WeatherResponse | null = null;
  @Input() cityData: City | null = null;
  @Input() isLoading = false;

  private weatherService = inject(WeatherService);

  weather = signal<WeatherResponse | null>(null);
  city = signal<City | null>(null);
  condition = signal<{ description: string, icon: string } | null>(null);
  currentDate = signal<Date>(new Date());

  private timer: any;

  ngOnChanges() {
    this.weather.set(this.weatherData);
    this.city.set(this.cityData);

    if (this.weatherData && this.weatherData.current) {
      const isDay = this.weatherData.current.is_day === 1;
      this.condition.set(
        this.weatherService.getWeatherCondition(this.weatherData.current.weather_code, isDay)
      );

      this.updateTime();
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.updateTime(), 60000);
    }
  }

  private updateTime() {
    if (!this.cityData || !this.cityData.timezone) {
      this.currentDate.set(new Date());
      return;
    }

    try {
      // Create a date object based on the city's timezone
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: this.cityData.timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).format(new Date());

      this.currentDate.set(new Date(formattedDate));
    } catch (e) {
      this.currentDate.set(new Date());
    }
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
