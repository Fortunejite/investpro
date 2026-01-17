'use client';

import Loading from '@/components/Loading';
import { useAppDispatch, useAppSelector } from '@/hooks/redux.hook';
import { fetchSettings } from '@/redux/settings.slice';
import { usePathname, useRouter } from 'next/navigation';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAppSelector((state) => state.user);
  const router = useRouter();
  const pathName = usePathname();
  const dispatch = useAppDispatch();

  // Fetch settings once authenticated
  if (status === 'authenticated') {
    dispatch(fetchSettings());
  }
  
  if (status === 'loading') {
    return (
      <Loading
        variant="splash"
        message="Initializing your investment dashboard..."
      />
    );
  } else if (status === 'unauthenticated') {
    router.push(`/auth/login?next=${encodeURIComponent(pathName)}`);
    return null;
  }

  return <>{children}</>;
};

export default ProtectedLayout;
