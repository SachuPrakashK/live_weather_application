import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly title = signal('aura-weather');
  isDarkMode = signal(true);

  ngOnInit() {
    const savedTheme = localStorage.getItem('aura-theme');
    if (savedTheme === 'light') {
      this.isDarkMode.set(false);
      document.documentElement.classList.remove('dark');
    } else {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('aura-theme', 'dark');
    }
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aura-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aura-theme', 'light');
    }
  }
}
