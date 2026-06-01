'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace('/login?error=auth');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding/perfil');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
        <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Autenticando com Google...
      </div>
    </div>
  );
}
