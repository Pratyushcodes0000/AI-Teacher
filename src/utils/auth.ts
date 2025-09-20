export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private listeners: Array<(authState: AuthState) => void> = [];

  private constructor() {
    this.loadFromStorage();
    this.initializeDemoAccount();
  }

  private initializeDemoAccount(): void {
    // Create demo account if it doesn't exist
    const existingUsers = this.getStoredUsers();
    const demoExists = existingUsers.find(u => u.email === 'demo@example.com');
    
    if (!demoExists) {
      const demoUser: User = {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        createdAt: new Date()
      };
      
      const updatedUsers = [...existingUsers, demoUser];
      try {
        localStorage.setItem('academic_assistant_all_users', JSON.stringify(updatedUsers));
      } catch (error) {
        console.warn('Failed to create demo account:', error);
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('academic_assistant_user');
      if (stored) {
        const userData = JSON.parse(stored);
        this.currentUser = {
          ...userData,
          createdAt: new Date(userData.createdAt)
        };
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.currentUser = null;
    }
  }

  private saveToStorage(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem('academic_assistant_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('academic_assistant_user');
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  private notifyListeners(): void {
    const authState: AuthState = {
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: false
    };
    this.listeners.forEach(listener => listener(authState));
  }

  subscribe(listener: (authState: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener({
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: false
    });

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple email validation
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Check if user exists (simulate database check)
    const existingUsers = this.getStoredUsers();
    const existingUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      return { success: false, error: 'No account found with this email. Please sign up first.' };
    }

    // In a real app, you would verify the password hash
    // For demo purposes, we'll accept any password for existing users
    this.currentUser = existingUser;
    this.saveToStorage(this.currentUser);
    this.notifyListeners();

    return { success: true };
  }

  async signUp(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validation
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters long' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Check if user already exists
    const existingUsers = this.getStoredUsers();
    const existingUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: new Date()
    };

    // Store in "database" (localStorage)
    const updatedUsers = [...existingUsers, newUser];
    try {
      localStorage.setItem('academic_assistant_all_users', JSON.stringify(updatedUsers));
    } catch (error) {
      return { success: false, error: 'Failed to create account. Please try again.' };
    }

    // Sign in the new user
    this.currentUser = newUser;
    this.saveToStorage(this.currentUser);
    this.notifyListeners();

    return { success: true };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.saveToStorage(null);
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  private getStoredUsers(): User[] {
    try {
      const stored = localStorage.getItem('academic_assistant_all_users');
      if (stored) {
        return JSON.parse(stored).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load users from storage:', error);
    }
    return [];
  }
}

export const authService = AuthService.getInstance();