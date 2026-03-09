import { Component, Input, OnChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { WeatherResponse } from '../../models/weather.model';
import { WeatherService } from '../../services/weather.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-hourly-forecast',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './hourly-forecast.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HourlyForecastComponent implements OnChanges {
    @Input() weatherData: WeatherResponse | null = null;
    @Input() isLoading = false;

    private weatherService = inject(WeatherService);

    public hourlyCards = signal<{ time: string; temp: number; wind: number; rain: number; icon: string }[]>([]);

    public lineChartData: ChartConfiguration['data'] = {
        datasets: [],
        labels: []
    };

    public lineChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            line: { tension: 0.4 }
        },
        scales: {
            x: { grid: { display: false } },
            y: { display: false }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.formattedValue}°`
                }
            }
        }
    };

    public lineChartType: ChartType = 'line';

    ngOnChanges() {
        if (this.weatherData && this.weatherData.hourly) {
            const now = new Date();
            now.setMinutes(0, 0, 0); // truncate to current hour
            const currentHourStr = now.toISOString().slice(0, 13) + ':00';

            const startIndex = this.weatherData.hourly.time.findIndex(t => t.startsWith(currentHourStr)) || 0;
            const validStartIndex = startIndex !== -1 ? startIndex : 0;

            const endIdx = validStartIndex + 24; // Show next 24 hours

            const sliceTimes = this.weatherData.hourly.time.slice(validStartIndex, endIdx);
            const sliceTemps = this.weatherData.hourly.temperature_2m.slice(validStartIndex, endIdx);
            const sliceWinds = this.weatherData.hourly.wind_speed_10m.slice(validStartIndex, endIdx);
            const sliceRain = this.weatherData.hourly.precipitation_probability.slice(validStartIndex, endIdx);
            const sliceCodes = this.weatherData.hourly.weather_code.slice(validStartIndex, endIdx);

            const cards = sliceTimes.map((timeStr, i) => {
                const isDay = parseInt(timeStr.slice(11, 13)) > 6 && parseInt(timeStr.slice(11, 13)) < 18;
                const condition = this.weatherService.getWeatherCondition(sliceCodes[i], true); // simplification

                return {
                    time: timeStr,
                    temp: sliceTemps[i],
                    wind: sliceWinds[i],
                    rain: sliceRain[i],
                    icon: condition.icon
                };
            });

            this.hourlyCards.set(cards);

            // Setup Chart
            this.lineChartData = {
                labels: cards.map(c => new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                datasets: [
                    {
                        data: cards.map(c => c.temp),
                        label: 'Temperature',
                        backgroundColor: 'rgba(56, 189, 248, 0.2)',
                        borderColor: 'rgba(56, 189, 248, 1)',
                        pointBackgroundColor: 'rgba(56, 189, 248, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(56, 189, 248, 0.8)',
                        fill: 'origin',
                    }
                ]
            };
        }
    }
}
