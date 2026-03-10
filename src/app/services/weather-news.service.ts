import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NewsArticle, NewsFilter } from '../models/weather-news.model';

@Injectable({
    providedIn: 'root'
})
export class WeatherNewsService {
    private http = inject(HttpClient);
    // We allow setting the API key dynamically from localStorage or defaulting to the user's key.
    private getApiKey(): string {
        return localStorage.getItem('gnews_api_key') || '92ac1b32d0005523df4e0e6424719d70';
    }

    setApiKey(key: string) {
        localStorage.setItem('gnews_api_key', key);
    }

    getNews(filter: NewsFilter, city?: string): Observable<NewsArticle[]> {
        let searchQuery = 'weather India';

        switch (filter) {
            case 'Monsoon Updates':
                searchQuery = 'monsoon India';
                break;
            case 'Cyclone Alerts':
                searchQuery = 'cyclone India';
                break;
            case 'Rain Alerts':
                searchQuery = 'rain alert India';
                break;
            case 'Heatwave Alerts':
                searchQuery = 'heatwave India';
                break;
            case 'All India Weather News':
            default:
                searchQuery = 'weather India';
                break;
        }

        if (city) {
            // Append city to search query to show location-based news
            searchQuery += ` OR weather ${city} OR rain ${city} OR cyclone ${city}`;
        }

        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&country=in&max=10&apikey=${this.getApiKey()}`;

        return this.http.get<any>(url).pipe(
            map(res => {
                if (!res.articles) {
                    throw new Error('No articles found');
                }
                return res.articles.map((a: any) => ({
                    title: a.title,
                    description: a.description,
                    source: a.source.name,
                    publishedAt: new Date(a.publishedAt),
                    imageUrl: a.image,
                    url: a.url
                }));
            }),
            catchError((err) => {
                const msg = err?.error?.errors?.[0] || 'Failed to fetch real news from GNews API.';
                return throwError(() => new Error(msg));
            })
        );
    }

    getWeatherAlerts(city?: string): Observable<NewsArticle[]> {
        const query = city ? `weather warning alert ${city}` : `weather warning alert India`;
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=3&apikey=${this.getApiKey()}`;

        return this.http.get<any>(url).pipe(
            map(res => {
                if (!res.articles) {
                    return [];
                }
                return res.articles.map((a: any) => ({
                    title: a.title,
                    description: a.description,
                    source: a.source.name,
                    publishedAt: new Date(a.publishedAt),
                    imageUrl: a.image,
                    url: a.url
                }));
            }),
            catchError(() => of([])) // alerts can fail silently returning empty
        );
    }

}
