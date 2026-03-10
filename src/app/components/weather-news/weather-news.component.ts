import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherNewsService } from '../../services/weather-news.service';
import { NewsArticle, NewsFilter } from '../../models/weather-news.model';
import { City } from '../../models/city.model';

@Component({
    selector: 'app-weather-news',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './weather-news.component.html',
    styles: [`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
        .carousel {
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
        }
    `]
})
export class WeatherNewsComponent implements OnInit, OnChanges {
    @Input() city: City | null = null;

    private weatherNewsService = inject(WeatherNewsService);

    isLoading = signal<boolean>(true);
    isAlertsLoading = signal<boolean>(true);
    errorMessage = signal<string | null>(null);

    newsArticles = signal<NewsArticle[]>([]);
    alertArticles = signal<NewsArticle[]>([]);
    carouselArticles = signal<NewsArticle[]>([]);

    selectedFilter = signal<NewsFilter>('All India Weather News');

    filters: NewsFilter[] = [
        'All India Weather News',
        'Monsoon Updates',
        'Cyclone Alerts',
        'Rain Alerts',
        'Heatwave Alerts'
    ];

    ngOnInit() {
        this.fetchNews();
        this.fetchAlerts();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['city']) {
            this.fetchNews();
            this.fetchAlerts();
        }
    }

    setFilter(filter: NewsFilter) {
        this.selectedFilter.set(filter);
        this.fetchNews();
    }

    private fetchNews() {
        this.isLoading.set(true);
        const currentCityName = this.city ? this.city.name : undefined;
        this.weatherNewsService.getNews(this.selectedFilter(), currentCityName).subscribe({
            next: (articles) => {
                this.newsArticles.set(articles);
                if (this.selectedFilter() === 'All India Weather News') {
                    this.carouselArticles.set(articles.slice(0, 8));
                }
                this.errorMessage.set(null);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.errorMessage.set(err.message);
                this.isLoading.set(false);
            }
        });
    }

    private fetchAlerts() {
        this.isAlertsLoading.set(true);
        const currentCityName = this.city ? this.city.name : undefined;
        this.weatherNewsService.getWeatherAlerts(currentCityName).subscribe((alerts) => {
            this.alertArticles.set(alerts);
            this.isAlertsLoading.set(false);
        });
    }

    scrollCarousel(dir: number, carouselEl: HTMLElement) {
        const scrollAmount = 300;
        carouselEl.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    }

    saveApiKey(key: string) {
        if (!key.trim()) return;
        this.weatherNewsService.setApiKey(key.trim());
        this.fetchNews();
        this.fetchAlerts();
    }
}
