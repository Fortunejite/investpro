'use client';

import { useAppDispatch } from '@/hooks/redux.hook';
import '@/lib/axios-interceptor.ts';
import store from '@/redux/store';
import { fetchUser } from '@/redux/user.slice';
import { Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import Loading from './Loading';

const LoadReduxState = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  return <></>;
};

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Provider store={store}>
        <LoadReduxState />
        <Suspense
          fallback={
            <Loading
              variant="splash"
              message="Initializing application..."
            />
          }
        >
          {children}
        </Suspense>
      </Provider>
    </>
  );
};

export default Providers;
