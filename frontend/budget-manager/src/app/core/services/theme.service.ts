import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'budget-manager-theme';
  private readonly platformId = inject(PLATFORM_ID);
  
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;

  constructor() {
    // Initialize with stored theme or default to light
    const storedTheme = this.getStoredTheme();
    this.themeSubject = new BehaviorSubject<Theme>(storedTheme);
    this.theme$ = this.themeSubject.asObservable();
    
    // Apply theme on init
    this.applyTheme(storedTheme);
  }

  /**
   * Get current theme value
   */
  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme: Theme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      
      if (theme === 'dark') {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    }
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return (stored === 'dark' || stored === 'light') ? stored : 'light';
    }
    return 'light';
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }
}
