type SpotifyArtist = {
    external_urls: {
        spotify: string;
    };
    followers: {
        href: null;
        total: number;
    };
    genres: string[];
    href: string;
    id: string;
    images: {
        url: string;
        height: number;
        width: number;
    }[];
    name: string;
    popularity: number;
    type: string;
    uri: string;
};



type SpotifyArtistsData = {
    artists: SpotifyArtist[];
};

type SpotifyFollowedArtistsData = {
    href: string;
    limit: number;
    next: null;
    cursors: {
        after: null
    };
    total: number;
    items: SpotifyArtist[];
};