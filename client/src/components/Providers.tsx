'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import '@/lib/axios-interceptor.ts';
import store from '@/redux/store';
import { fetchUser } from '@/redux/user.slice';
import { Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import Loading from './Loading';
import { fetchSettings } from '@/redux/settings.slice';

const LoadReduxState = () => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.user);

  useEffect(() => {
    const getInitialDarkMode = () => {
      if (typeof window === 'undefined') return false;
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    };
    if (getInitialDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  useEffect(() => {
    // Fetch user settings once user is authenticated
    if (status === 'authenticated') {
      dispatch(fetchSettings());
    }
  }, [dispatch, status]);

  return <></>;
};

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Provider store={store}>
        <LoadReduxState />
        <Suspense
          fallback={
            <Loading variant="splash" message="Initializing application..." />
          }
        >
          {children}
        </Suspense>
        <Toaster position="top-right" richColors closeButton />
      </Provider>
    </>
  );
};

export default Providers;
