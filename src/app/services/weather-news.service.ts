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
        if (typeof localStorage !== 'undefined') {
            const storedKey = localStorage.getItem('newsdata_api_key');
            // Check valid structure (newsdata keys usually start with pub_...)
            if (storedKey && storedKey.length > 25) {
                return storedKey;
            }
        }
        return 'pub_917066b709e0452d9f67c19715fd52c8';
    }

    setApiKey(key: string) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('newsdata_api_key', key);
        }
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

        const apiKey = this.getApiKey();
        if (!apiKey) {
            return throwError(() => new Error('API Key is missing. Please provide a NewsData.io key.'));
        }

        const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(searchQuery)}&language=en&country=in`;

        return this.http.get<any>(url).pipe(
            map(res => {
                if (!res.results || res.results.length === 0) {
                    throw new Error('No articles found');
                }
                return res.results.map((a: any) => ({
                    title: a.title,
                    description: a.description || 'No description available.',
                    source: a.source_id || 'News Source',
                    publishedAt: new Date(a.pubDate),
                    imageUrl: a.image_url || 'https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    url: a.link
                }));
            }),
            catchError((err) => {
                const msg = err?.error?.results?.message || err.message || 'Failed to fetch real news from NewsData API.';
                return throwError(() => new Error(msg));
            })
        );
    }

    getWeatherAlerts(city?: string): Observable<NewsArticle[]> {
        const query = city ? `weather warning alert ${city}` : `weather warning alert India`;
        const apiKey = this.getApiKey();
        if (!apiKey) return of([]);

        const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&country=in`;

        return this.http.get<any>(url).pipe(
            map(res => {
                if (!res.results) {
                    return [];
                }
                return res.results.slice(0, 3).map((a: any) => ({
                    title: a.title,
                    description: a.description || 'No description available.',
                    source: a.source_id || 'News Source',
                    publishedAt: new Date(a.pubDate),
                    imageUrl: a.image_url || 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                    url: a.link
                }));
            }),
            catchError(() => of([])) // alerts can fail silently returning empty
        );
    }

}
