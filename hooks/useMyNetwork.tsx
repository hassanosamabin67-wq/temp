import { useEffect, useState } from "react";
import { supabase } from "@/config/supabase";
import { useNotification } from "@/Components/custom/custom-notification";

interface Visionary {
    userId: string;
    firstName: string;
    lastName: string;
}

export function useMyNetwork(clientId: string) {
    const { notify } = useNotification();
    const [favoriteVisionaries, setFavoriteVisionaries] = useState<string[]>([]);
    const [addVisionaryLoading, setAddVisionaryLoading] = useState<string | null>('');
    const [allVisionaries, setAllVisionaries] = useState<any>([]);
    const [allFavoriteVisionaries, setAllFavoriteVisionaries] = useState<any>([]);
    const [dataLoading, setDataLoading] = useState(false);

    const handleToggleFavorite = async (visionary: Visionary) => {
        try {
            setAddVisionaryLoading(visionary.userId);

            if (favoriteVisionaries.includes(visionary.userId)) {
                const { error } = await supabase
                    .from("my_network")
                    .delete()
                    .eq("client_id", clientId)
                    .eq("visionary_id", visionary.userId);

                if (error) {
                    console.error("Error removing visionary:", error);
                    return;
                }

                setFavoriteVisionaries((prev) => prev.filter((id) => id !== visionary.userId));
                notify({ type: "success", message: `${visionary.firstName} ${visionary.lastName} removed from favorites` });

            } else {
                const { error } = await supabase
                    .from("my_network")
                    .insert({
                        client_id: clientId,
                        visionary_id: visionary.userId,
                    });

                if (error) {
                    console.error("Error adding visionary:", error);
                    return;
                }

                setFavoriteVisionaries((prev) => [...prev, visionary.userId]);
                notify({ type: "success", message: `${visionary.firstName} ${visionary.lastName} added to favorites` });
            }
        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setAddVisionaryLoading(null);
        }
    };

    const handleFetchFavorites = async () => {
        try {
            const { data, error } = await supabase
                .from("my_network")
                .select("visionary_id")
                .eq("client_id", clientId);

            if (error) {
                console.error("Error fetching favorite visionaries:", error);
                return;
            }

            const visionaryIds = data?.map((item: any) => item.visionary_id) || [];
            setFavoriteVisionaries(visionaryIds);
        } catch (error) {
            console.error("Unexpected Error: ", error);
        }
    };

    const handleFetchAllVisionaries = async () => {
        try {
            setDataLoading(true)
            const { data: visionaries, error } = await supabase
                .from('users')
                .select("*")
                .eq("profileType", "Visionary")

            if (error) {
                console.error("Error Fetching Visionaries: ", error);
                return;
            }

            const visionaryIds = [...new Set(visionaries.map((v) => v.userId))]

            const { data: visionariesPortfolio, error: portfolioError } = await supabase
                .from('profile_portfolio')
                .select("*")
                .in("user_id", visionaryIds)

            if (portfolioError) {
                console.error("Error Fetching Visionary's Portfolio: ", portfolioError);
                return;
            }

            const combinedResult = visionaries.map((v) => {
                const visionaryPortfolios = visionariesPortfolio.filter((p) => p.user_id === v.userId);
                return {
                    ...v,
                    portfolioUploaded: visionaryPortfolios.length || null
                }
            })

            setAllVisionaries(combinedResult)

        } catch (err) {
            console.error("Unexpected Error While Fetching Visionaries: ", err)
        } finally {
            setDataLoading(false)
        }
    }

    const handleFetchFavoritesDetail = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .in("userId", favoriteVisionaries)

            if (error) {
                console.error("Error fetching favorite details:", error)
                return;
            }

            const { data: visionariesPortfolio, error: portfolioError } = await supabase
                .from('profile_portfolio')
                .select("*")
                .in("user_id", favoriteVisionaries)

            if (portfolioError) {
                console.error("Error Fetching Visionary's Portfolio: ", portfolioError);
                return;
            }

            const combinedResult = data.map((v) => {
                const visionaryPortfolios = visionariesPortfolio.filter((p) => p.user_id === v.userId);
                return {
                    ...v,
                    portfolioUploaded: visionaryPortfolios.length || null
                }
            })
            setAllFavoriteVisionaries(combinedResult)

        } catch (error) {
            console.error("Unexpected error:", error)
        }
    }

    useEffect(() => {
        if (clientId) {
            handleFetchFavorites();
            handleFetchAllVisionaries()
        }
    }, [clientId]);

    return {
        favoriteVisionaries,
        addVisionaryLoading,
        toggleFavorite: handleToggleFavorite,
        allVisionaries,
        dataLoading
    };
}