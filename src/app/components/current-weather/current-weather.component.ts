import { Component, Input, OnChanges, inject, signal, ChangeDetectionStrategy, OnDestroy, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { WeatherResponse, AQIResponse } from '../../models/weather.model';
import { City } from '../../models/city.model';
import { WeatherService } from '../../services/weather.service';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule, DatePipe, BaseChartDirective],
  templateUrl: './current-weather.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentWeatherComponent implements OnChanges, OnDestroy {
  @Input() weatherData: WeatherResponse | null = null;
  @Input() cityData: City | null = null;
  @Input() aqiData: AQIResponse | null = null;
  @Input() isLoading = false;

  public weatherService = inject(WeatherService);

  weather = signal<WeatherResponse | null>(null);
  city = signal<City | null>(null);
  aqi = signal<AQIResponse | null>(null);

  favorites = toSignal(this.weatherService.favorites$, { initialValue: [] });
  isFavorite = computed(() => {
    const currentCity = this.city();
    if (!currentCity) return false;
    return this.favorites().some(f => f.id === currentCity.id);
  });

  condition = signal<{ description: string, icon: string } | null>(null);
  currentDate = signal<Date>(new Date());

  // New Signals
  aqiScore = signal<number>(0);
  aqiStatus = signal<{ text: string, color: string }>({ text: 'Good', color: 'text-green-500' });
  healthRecommendation = signal<string>('Air quality is considered satisfactory, and air pollution poses little or no risk.');
  pm10 = signal<number>(0);
  pm25 = signal<number>(0);
  co = signal<number>(0);
  no2 = signal<number>(0);
  so2 = signal<number>(0);
  o3 = signal<number>(0);
  clothingSuggestion = signal<string>('Wear comfortable clothes.');
  sunrise = signal<string | null>(null);
  sunset = signal<string | null>(null);

  // AQI Chart Signals
  public aqiChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public aqiChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4, borderWidth: 3 }, point: { radius: 2, hoverRadius: 5 } },
    scales: { x: { grid: { display: false }, ticks: { color: 'rgba(148, 163, 184, 0.8)', font: { size: 10 } } }, y: { display: true, position: 'left', grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: 'rgba(148, 163, 184, 0.8)', font: { size: 10 } } } },
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#f8fafc', bodyColor: '#e2e8f0', cornerRadius: 8 } },
    interaction: { mode: 'index', intersect: false }
  };
  public aqiChartType: ChartType = 'line';

  private timer: any;

  ngOnChanges() {
    this.weather.set(this.weatherData);
    this.city.set(this.cityData);
    this.aqi.set(this.aqiData);

    if (this.weatherData && this.weatherData.current) {
      const isDay = this.weatherData.current.is_day === 1;
      this.condition.set(
        this.weatherService.getWeatherCondition(this.weatherData.current.weather_code, isDay)
      );

      this.generateSmartSuggestion(this.weatherData.current.temperature_2m, this.weatherData.current.precipitation, this.weatherData.current.wind_speed_10m);

      if (this.weatherData.daily && this.weatherData.daily.sunrise && this.weatherData.daily.sunset) {
        this.sunrise.set(this.weatherData.daily.sunrise[0] || null);
        this.sunset.set(this.weatherData.daily.sunset[0] || null);
      }

      this.updateTime();
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.updateTime(), 60000);
    }

    if (this.aqiData && this.aqiData.hourly && this.aqiData.hourly.us_aqi.length > 0) {
      const currentHourIndex = new Date().getHours();
      const score = this.aqiData.hourly.us_aqi[currentHourIndex] || this.aqiData.hourly.us_aqi[0];
      this.aqiScore.set(score);
      this.generateAQIStatus(score);

      this.pm10.set(this.aqiData.hourly.pm10[currentHourIndex] || 0);
      this.pm25.set(this.aqiData.hourly.pm2_5[currentHourIndex] || 0);
      this.co.set(this.aqiData.hourly.carbon_monoxide[currentHourIndex] || 0);
      this.no2.set(this.aqiData.hourly.nitrogen_dioxide[currentHourIndex] || 0);
      this.so2.set(this.aqiData.hourly.sulphur_dioxide?.[currentHourIndex] || 0);
      this.o3.set(this.aqiData.hourly.ozone?.[currentHourIndex] || 0);

      // Generate Chart Data for the next 24 hours
      const chartLabels = [];
      const chartAqiData = [];
      const ctxColors = [];
      for (let i = 0; i < 24; i++) {
        const idx = currentHourIndex + i;
        if (idx < this.aqiData.hourly.time.length) {
          const timeLabel = new Date(this.aqiData.hourly.time[idx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          chartLabels.push(timeLabel);
          const val = this.aqiData.hourly.us_aqi[idx] || 0;
          chartAqiData.push(val);
          if (val <= 50) ctxColors.push('#22c55e');
          else if (val <= 100) ctxColors.push('#eab308');
          else if (val <= 150) ctxColors.push('#f97316');
          else if (val <= 200) ctxColors.push('#ef4444');
          else ctxColors.push('#a855f7');
        }
      }

      this.aqiChartData = {
        labels: chartLabels,
        datasets: [{
          data: chartAqiData,
          label: 'AQI Forecast',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderColor: ctxColors,
          pointBackgroundColor: ctxColors,
          pointBorderColor: '#fff',
          fill: 'origin'
        }]
      };
    }
  }

  generateAQIStatus(score: number) {
    if (score <= 50) {
      this.aqiStatus.set({ text: 'Good', color: 'text-green-500' });
      this.healthRecommendation.set('Air quality is satisfactory, and poses little or no risk.');
    } else if (score <= 100) {
      this.aqiStatus.set({ text: 'Moderate', color: 'text-yellow-500' });
      this.healthRecommendation.set('Air quality is acceptable. Sensitive individuals should avoid prolonged outdoor exertion.');
    } else if (score <= 150) {
      this.aqiStatus.set({ text: 'Unhealthy for Sensitive Groups', color: 'text-orange-500' });
      this.healthRecommendation.set('General public is not likely to be affected. Sensitive groups should reduce outdoor exertion.');
    } else if (score <= 200) {
      this.aqiStatus.set({ text: 'Unhealthy', color: 'text-red-500' });
      this.healthRecommendation.set('Everyone may experience health effects. Limit outdoor exertion.');
    } else if (score <= 300) {
      this.aqiStatus.set({ text: 'Very Unhealthy', color: 'text-purple-500' });
      this.healthRecommendation.set('Health alert! The entire population is likely to be affected. Avoid outdoor activities.');
    } else {
      this.aqiStatus.set({ text: 'Hazardous', color: 'text-red-900' });
      this.healthRecommendation.set('Health warning of emergency conditions! Everyone should avoid any outdoor exertion.');
    }
  }

  generateSmartSuggestion(temp: number, precip: number, wind: number) {
    if (precip > 0.5) {
      this.clothingSuggestion.set('Rain expected! Carry an umbrella ☔ and wear waterproof clothing.');
    } else if (wind > 30) {
      this.clothingSuggestion.set('Strong winds! A windbreaker 🧥 is highly recommended.');
    } else if (temp < 10) {
      this.clothingSuggestion.set('Extremely cold outside! Wear a heavy jacket 🧥 and gloves 🧤.');
    } else if (temp < 20) {
      this.clothingSuggestion.set('The weather is crisp. A light jacket or warm sweater 🧣 is perfect.');
    } else if (temp > 30) {
      this.clothingSuggestion.set('It is very hot! Wear light clothing 🎽 and stay hydrated 💧.');
    } else {
      this.clothingSuggestion.set('Perfect weather! Wear your most comfortable clothes 👕.');
    }
  }

  private updateTime() {
    if (!this.cityData || !this.cityData.timezone) {
      this.currentDate.set(new Date());
      return;
    }
    try {
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: this.cityData.timezone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
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
