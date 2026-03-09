import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService } from '../../services/weather.service';
import { City } from '../../models/city.model';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent {
  private weatherService = inject(WeatherService);

  searchQuery = '';
  searchSubject = new Subject<string>();

  results = signal<City[]>([]);
  isLoading = signal<boolean>(false);
  showDropdown = signal<boolean>(false);

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
      this.showDropdown.set(false);
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

  clearSearch() {
    this.searchQuery = '';
    this.results.set([]);
    this.showDropdown.set(false);
    this.isLoading.set(false);
    this.weatherService.resetToDefault();
  }

  onBlur() {
    // Delay hiding dropdown so mousedown on item registers
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
