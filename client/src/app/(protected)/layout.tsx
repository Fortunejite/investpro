'use client';

import Loading from '@/components/Loading';
import { useAppSelector } from '@/hooks/redux.hook';
import { useRouter } from 'next/navigation';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAppSelector((state) => state.user);
  const router = useRouter();

  if (status === 'loading') {
    return (
      <Loading
        variant="splash"
        message="Initializing your investment dashboard..."
      />
    );
  } else if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedLayout;
