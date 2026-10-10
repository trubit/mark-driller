import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { apiClient } from '../api/client.js';
import { BrandLoader } from './BrandLoader.js';

/**
 * Direct entry route for `/cbt`.
 * Automatically routes students to their active examination attempt if in progress,
 * or to the CBT Examination Portal to select and launch an examination.
 * Never renders a blank screen or unwanted error card.
 */
export const CbtDirectRouter: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('md_token') : null;
    if (!token && !isAuthenticated && !user) {
      navigate('/', { state: { openLogin: true }, replace: true });
      return;
    }

    let isMounted = true;

    apiClient<{ attemptId: string } | null>('/api/cbt/active')
      .then((res) => {
        if (!isMounted) return;
        if (res && res.attemptId) {
          navigate(`/cbt/${res.attemptId}`, { replace: true });
        } else {
          navigate('/portal/cbt', { replace: true });
        }
      })
      .catch((err) => {
        console.warn('[CbtDirectRouter] Could not retrieve active attempt:', err);
        if (!isMounted) return;
        navigate('/portal/cbt', { replace: true });
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate]);

  return <BrandLoader message="Connecting to CBT examination room..." mode="fullscreen" />;
};
export default CbtDirectRouter;
