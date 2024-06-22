type SpotifyUser = {
    display_name: string;
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    images: Array<any>; // You might want to define a more specific type for images if needed
    type: string;
    uri: string;
    followers: {
        href: null | string; // null if no link, or a string URL
        total: number;
    };
    country: string;
    product: string;
    explicit_content: {
        filter_enabled: boolean;
        filter_locked: boolean;
    };
    email: string;
};