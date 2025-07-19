import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // İlk session kontrolü
    getInitialSession();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Loading'i sadece başarılı giriş veya çıkış durumunda false yap
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getInitialSession = async () => {
    try {
      const { session, error } = await authService.getSession();
      if (error) {
        console.log('Session error:', error);
        // Hatalı session durumunda temizle
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.log('Initial session error:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const result = await authService.signIn(email, password);
    // Loading state'i sadece başarılı giriş durumunda değiştir
    // Başarısız giriş durumunda kullanıcı login ekranında kalmalı
    return result;
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    const result = await authService.signUp(email, password, fullName);
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    // Hemen local state'i temizle - hiçbir hata durumunda bekletme
    setSession(null);
    setUser(null);
    setLoading(false);
    
    // Arka planda sessizce Supabase ve AsyncStorage temizliği yap
    setTimeout(async () => {
      try {
        await authService.signOut();
      } catch (error) {
        // Sessizce ignore et
        console.log('Background signOut completed with error (ignored):', error);
      }
    }, 0);
    
    // Anında başarılı sonuç döndür
    return { success: true };
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };



  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};