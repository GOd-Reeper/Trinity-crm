'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from './types';
import { supabase } from './supabase';
import { 
  getLiveSession, 
  setLiveSession, 
  clearLiveSession 
} from './session';

interface AuthContextType {
  user: Profile | null;
  role: 'admin' | 'employee' | null;
  isLoading: boolean;
  loginAdmin: (codeOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginAdminWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  loginEmployee: (codeOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginEmployeeWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserDirect: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check encrypted 24-hour live session ('24-live')
    const activeSession = getLiveSession();
    if (activeSession && activeSession.user && activeSession.role) {
      setUser(activeSession.user);
      setRole(activeSession.role);
      setIsLoading(false);
      return;
    }

    // 2. Legacy fallback check
    const savedUser = localStorage.getItem('trinity_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as Profile;
        setUser(parsed);
        setRole(parsed.role);
        // Upgrade to 24-live encrypted session
        setLiveSession(parsed, parsed.role);
      } catch {
        clearLiveSession();
      }
    }
    setIsLoading(false);
  }, []);

  // PIN-only login for employee (Faster lookup & no ID input required)
  const loginEmployeeWithPin = async (pin: string) => {
    setIsLoading(true);
    try {
      const cleanPin = pin.trim();
      if (!cleanPin) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your PIN' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .eq('pin_hash', cleanPin)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect Employee PIN' };
      }

      setUser(data);
      setRole('employee');
      setLiveSession(data, 'employee');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // PIN-only login for admin
  const loginAdminWithPin = async (pin: string) => {
    setIsLoading(true);
    try {
      const cleanPin = pin.trim();
      if (!cleanPin) {
        setIsLoading(false);
        return { success: false, error: 'Please enter Admin PIN' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .eq('pin_hash', cleanPin)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect Admin PIN' };
      }

      setUser(data);
      setRole('admin');
      setLiveSession(data, 'admin');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

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
      setLiveSession(data, 'admin');
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
      setLiveSession(data, 'employee');
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
    clearLiveSession();
  };

  const setUserDirect = (profile: Profile) => {
    setUser(profile);
    setRole(profile.role);
    setLiveSession(profile, profile.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginAdmin,
        loginAdminWithPin,
        loginEmployee,
        loginEmployeeWithPin,
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
