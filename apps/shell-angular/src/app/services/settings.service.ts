import { Injectable, signal } from "@angular/core";

export interface User {
  email: string;
  id: number;
  name: string;
  role: string;
}

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private _theme = signal<"dark" | "light">("light");
  readonly theme = this._theme.asReadonly();

  private _user = signal<User>({
    email: "user@example.com",
    id: 1,
    name: "John Doe",
    role: "Developer",
  });
  readonly user = this._user.asReadonly();

  setTheme = (theme: "dark" | "light") => {
    this._theme.set(theme);
  };

  toggleTheme = () => {
    const newTheme = this._theme() === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  };

  setUser = (user: User) => {
    this._user.set(user);
  };

  updateUser = (updates: Partial<User>) => {
    this._user.update((current) => ({ ...current, ...updates }));
  };
}
