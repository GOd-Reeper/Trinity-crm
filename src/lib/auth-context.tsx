'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from './types';
import { supabase } from './supabase';

interface AuthContextType {
  user: Profile | null;
  role: 'admin' | 'employee' | null;
  isLoading: boolean;
  loginAdmin: (codeOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginEmployee: (codeOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserDirect: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem('trinity_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as Profile;
        setUser(parsed);
        setRole(parsed.role);
      } catch {
        localStorage.removeItem('trinity_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginAdmin = async (codeOrPhone: string, pin: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .or(`employee_code.ilike.${codeOrPhone},phone.eq.${codeOrPhone}`)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setIsLoading(false);
        return { success: false, error: 'Admin account not found or invalid credentials' };
      }

      if (data.pin_hash !== pin) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect Admin PIN' };
      }

      setUser(data);
      setRole('admin');
      localStorage.setItem('trinity_user', JSON.stringify(data));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const loginEmployee = async (codeOrPhone: string, pin: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .or(`employee_code.ilike.${codeOrPhone},phone.eq.${codeOrPhone}`)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setIsLoading(false);
        return { success: false, error: 'Employee not found. Please contact admin.' };
      }

      if (data.pin_hash !== pin) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect Employee PIN' };
      }

      setUser(data);
      setRole('employee');
      localStorage.setItem('trinity_user', JSON.stringify(data));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('trinity_user');
  };

  const setUserDirect = (profile: Profile) => {
    setUser(profile);
    setRole(profile.role);
    localStorage.setItem('trinity_user', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginAdmin,
        loginEmployee,
        logout,
        setUserDirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

