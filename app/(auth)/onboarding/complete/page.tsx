"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";

export default function CompleteOnboarding() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth);

    const handleRedirect = async () => {
        try {
            await fetch("/api/stripe/refresh-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: profile.profileId }),
            });
            if (profile.profileType === 'client') {
                router.push('/dashboard/client')
            } else {
                router.push("/dashboard/visionary");
            }
        } catch (error) {
            console.error("Unexpected Error: ", error)
        }
    }

    useEffect(() => {
        handleRedirect()
    }, []);

    return (
        <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 600 }}>Redirecting to dashboard...</p>
        </div>
    );
}