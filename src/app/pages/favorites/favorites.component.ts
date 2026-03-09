import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WeatherService } from '../../services/weather.service';
import { FavoriteCity } from '../../models/weather.model';
import { City } from '../../models/city.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './favorites.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {
    public weatherService = inject(WeatherService);
    private router = inject(Router);

    favorites = toSignal(this.weatherService.favorites$, { initialValue: [] });

    removeFavorite(fav: FavoriteCity, event: Event) {
        event.stopPropagation();
        const mockCity: City = {
            id: fav.id,
            name: fav.name,
            country: fav.country,
            latitude: fav.latitude,
            longitude: fav.longitude,
            elevation: 0,
            feature_code: '',
            country_code: '',
            timezone: '',
            country_id: 0
        };
        this.weatherService.toggleFavorite(mockCity);
    }

    selectFavorite(fav: FavoriteCity) {
        const city: City = {
            id: fav.id,
            name: fav.name,
            country: fav.country,
            latitude: fav.latitude,
            longitude: fav.longitude,
            elevation: 0,
            feature_code: '',
            country_code: '',
            timezone: 'auto',
            country_id: 0
        };
        this.weatherService.setSelectedCity(city);
        this.router.navigate(['/']);
    }
}
