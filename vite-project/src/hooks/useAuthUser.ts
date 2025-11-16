import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { User } from '@/lib/types';

export function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setUser);
    return () => unsubscribe();
  }, []);

  return user;
}
