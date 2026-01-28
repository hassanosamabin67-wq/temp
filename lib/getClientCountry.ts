import { COUNTRY_MAP } from "./COUNTRY_MAP";

export async function getClientCountry() {
    try {
        const response = await fetch(`https://ipinfo.io/json?token=9063eb09bb0e26`);
        const ipData = await response.json();

        const code = ipData?.country || 'US';
        const name = code ? COUNTRY_MAP[code] || code : "United States";

        return {
            client_country_code: code,
            client_country_name: name,
        };
    } catch (error) {
        console.error("Error fetching client country:", error);
        return {
            client_country_code: null,
            client_country_name: null,
        };
    }
}