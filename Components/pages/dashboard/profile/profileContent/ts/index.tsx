    import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store'
import { useSearchParams } from 'next/navigation';
    import React, { useEffect, useState } from 'react'

    function useProfileStup() {
         const searchParam = useSearchParams();
            const visionary: string | null = searchParam.get("visionary");
            const profileRedux = useAppSelector((state) => state.auth);
            const [profile, setProfile] = useState(profileRedux);
            
            useEffect(() => {
              if (visionary) {
                fetchVisionaries();
              } else {
                setProfile(profileRedux); // Reset profile if no visionary is provided
              }
            }, [visionary, profileRedux]);
            
            const fetchVisionaries = async () => {
              try {
                const { data, error } = await supabase
                  .from("users")
                  .select("*")
                  .eq("profileId", visionary)
                  .single();
                console.log(visionary, data,"mmmnm");
                
                if (error) {
                  console.error("Error fetching visionary:", error);
                  return;
                }
            
                if (data) {
                  setProfile(data as any);
                }
              } catch (err) {
                console.error("Unexpected error fetching visionary:", err);
              }
            };
      return (
        {profile}
      )
    }

    export default useProfileStup