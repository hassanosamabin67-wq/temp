import { useEffect, useState } from 'react';

const useElapsedTime = (created_at: string) => {
    const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

    useEffect(() => {
        if (!created_at) return;

        const startTime = new Date(created_at);

        const interval = setInterval(() => {
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

            const hrs = String(Math.floor(diffInSeconds / 3600)).padStart(2, '0');
            const mins = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, '0');
            const secs = String(diffInSeconds % 60).padStart(2, '0');

            setElapsedTime(`${hrs}:${mins}:${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [created_at]);

    return elapsedTime;
};

export default useElapsedTime;