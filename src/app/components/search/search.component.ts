import { Component, ChangeDetectionStrategy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { WeatherService } from '../../services/weather.service';
import { City } from '../../models/city.model';
import { FavoriteCity } from '../../models/weather.model';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, finalize } from 'rxjs/operators';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent {
  public weatherService = inject(WeatherService);
  private cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  searchSubject = new Subject<string>();

  results = signal<City[]>([]);
  isLoading = signal<boolean>(false);
  isVoiceActive = signal<boolean>(false);
  showDropdown = signal<boolean>(false);

  favorites = toSignal(this.weatherService.favorites$, { initialValue: [] });

  constructor() {
    this.searchSubject.pipe(
      tap(() => this.isLoading.set(true)),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query) return of([]);
        return this.weatherService.searchCities(query).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(cities => {
      this.results.set(cities);
      this.isLoading.set(false);
      this.showDropdown.set(cities.length > 0);
    });
  }

  onSearchInput(query: string) {
    if (!query.trim()) {
      this.results.set([]);
      this.showDropdown.set(this.favorites().length > 0);
      this.isLoading.set(false);
      return;
    }
    this.searchSubject.next(query);
  }

  selectCity(city: City) {
    this.weatherService.setSelectedCity(city);
    this.searchQuery = city.name;
    this.showDropdown.set(false);
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
    this.selectCity(city);
  }

  clearSearch() {
    this.searchQuery = '';
    this.results.set([]);
    this.showDropdown.set(false);
    this.isLoading.set(false);
    this.weatherService.resetToDefault();
  }

  showFavorites() {
    if (this.searchQuery.trim().length === 0 && this.favorites().length > 0) {
      this.showDropdown.set(true);
    }
  }

  detectLocation() {
    this.isLoading.set(true);
    this.weatherService.detectLocation().subscribe(city => {
      this.isLoading.set(false);
      if (city) {
        this.selectCity(city);
      } else {
        alert('Geolocation failed. Please ensure location services are allowed.');
      }
    });
  }

  startVoiceSearch() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onstart = () => {
        this.isVoiceActive.set(true);
        this.cdr.detectChanges();
      };
      recognition.onend = () => {
        this.isVoiceActive.set(false);
        this.cdr.detectChanges();
      };
      recognition.onerror = () => {
        this.isVoiceActive.set(false);
        this.cdr.detectChanges();
      };

      recognition.onresult = (event: any) => {
        const query = event.results[0][0].transcript.replace(".", "");
        this.searchQuery = query;
        this.onSearchInput(query);
        this.cdr.detectChanges();
      };
      recognition.start();
    } else {
      alert("Voice search is not supported in this browser.");
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
