'use client';

import { useState, useEffect } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import Image from "next/image";
import { SpotifyLogo } from "./SpotifyLogo.jsx";
import { Bookmarks } from "./Bookmarks.jsx";
import { BookmarksDisabled } from "./BookmarksDisabled.jsx";
import Link from "next/link";
import { Button } from "@nextui-org/button";
import loginAnimated from '../assets/Animation - 1718996481802.gif';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Tooltip } from "@nextui-org/tooltip";
import { Spotify } from "react-spotify-embed";

export default function Home() {
  const [selectedItem, setSelectedItem] = useState("New Albums");
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser>();
  const [newAlbums, setNewAlbums] = useState<Array<SpotifyAlbum>>();
  const [featuredPlayLists, setFeaturedPlayLists] = useState<SpotifyPlaylists>();
  const [recommendedArtists, setRecommendedArtists] = useState<SpotifyArtist[]>();
  const [favoritesAlbums, setFavoritesAlbums] = useState<SpotifyFavorite[]>();
  const [favoritesPlaylists, setFavoritesPlaylists] = useState<SpotifyFavorite[]>();
  const [favoritesArtists, setFavoritesArtists] = useState<SpotifyFavorite[]>();
  const [openPlayer, setOpenPlayer] = useState<boolean>(false);
  const [playerLink, setPlayerLink] = useState<string>();

  const clientId = "06ee099d9e294e14ada8c5975be4e183";
  const redirectUri = "http://localhost:3000/"; // This should match the URI registered in Spotify Dashboard
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-follow-read"
    // Add any other scopes you need
  ];
  var spotify_access_token: string | null;

  const loadAccessToken = async () => {
    spotify_access_token = localStorage.getItem("spotify_access_token")
  }

  const login = () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(" "))}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem("spotify_access_token");
    window.location.href = "";
  }

  const extractTokenFromUrl = () => {
    const hash = window.location.hash;
    if (!hash) return null;

    const params = new URLSearchParams(hash.substring(1));
    return params.get("access_token");
  };

  const saveToken = (token: string) => {
    localStorage.setItem("spotify_access_token", token);
  };

  const handleLoginRedirect = async () => {
    const token = extractTokenFromUrl();
    if (token) {
      saveToken(token);
      var userInfo = await getSpotifyUserInfo();
      const payload = { 'accessToken': token, ...userInfo };

      // Clear the hash
      window.location.hash = "";

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      fetch('http://localhost:8000/login', requestOptions)
        .then(response => response.json())
        .then(data => setSpotifyUser(data))
        .catch(error => console.error('Error:', error));
    } else if (spotify_access_token) {
      const payload = { 'accessToken': spotify_access_token };
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      fetch('http://localhost:8000/login_token', requestOptions)
        .then(response => response.json())
        .then(data => { setSpotifyUser(data) })
        .catch(error => console.error('Error:', error));
    }
  };

  const retriveUserFavorites = (data: SpotifyFavorite[]) => {
    var result_A: SpotifyFavorite[] = data.filter((v) => v['type'] == 'album');
    setFavoritesAlbums(result_A);
    var result_B: SpotifyFavorite[] = data.filter((v) => v['type'] == 'playlist');
    setFavoritesPlaylists(result_B);
    var result_C: SpotifyFavorite[] = data.filter((v) => v['type'] == 'artist');
    setFavoritesArtists(result_C);
  }

  const getUserFavorites = async () => {
    if (spotifyUser) {
      const payload = { 'user_id': spotifyUser.id };

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      fetch('http://localhost:8000/get_user_favorites', requestOptions)
        .then(response => response.json())
        .then(data => { retriveUserFavorites(data) })
        .catch(error => console.error('Error:', error));
    }
  };

  const addUserFavorite = async (type: string, data: object, data_id: string) => {
    if (spotifyUser) {

      const payload = { 'user_id': spotifyUser.id, 'type': type, 'data': data, 'data_id': data_id };

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      fetch('http://localhost:8000/add_user_favorite', requestOptions)
        .then(response => response.json())
        // .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

      switch (type) {
        case 'album':
          setFavoritesAlbums([...favoritesAlbums ?? [], payload]);

          break;
        case 'playlist':
          setFavoritesPlaylists([...favoritesPlaylists ?? [], payload]);

          break;
        case 'artist':
          setFavoritesArtists([...favoritesArtists ?? [], payload]);
          break;
        default:
          break;
      }
    }
  };

  const removeUserFavorite = async (type: string, data_id: string) => {
    if (spotifyUser) {
      const payload = { 'user_id': spotifyUser.id, 'data_id': data_id };

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      fetch('http://localhost:8000/remove_user_favorite', requestOptions)
        .then(response => response.json())
        // .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
      switch (type) {
        case 'album':
          setFavoritesAlbums([...favoritesAlbums ?? []].filter((e) => e.data_id != data_id));
          break;
        case 'playlist':
          setFavoritesPlaylists([...favoritesPlaylists ?? []].filter((e) => e.data_id != data_id));
          break;
        case 'artist':
          setFavoritesArtists([...favoritesArtists ?? []].filter((e) => e.data_id != data_id));
          break;
        default:
          break;
      }
    }
  };


  const getSpotifyUserInfo = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': 'Bearer ' + spotify_access_token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Request failed: ' + response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Spotify user info:', error);
    }
  };


  const fetchNewReleaseAlbums = async () => {
    const url = 'https://api.spotify.com/v1/browse/new-releases';

    // Set up the request options, including the Authorization header
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${spotify_access_token}`,
        'Content-Type': 'application/json'
      }
    };
    // Perform the fetch request
    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setNewAlbums(data['albums']['items']);
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
      });
  }

  const fetchFeaturedPlaylists = async () => {
    const limit = 20;
    const offset = 5;
    const url = ` https://api.spotify.com/v1/browse/featured-playlists?limit=${limit}&offset=${offset}`;

    // Set up the request options, including the Authorization header
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${spotify_access_token}`,
        'Content-Type': 'application/json'
      }
    };
    // Perform the fetch request
    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // console.log(data);
        setFeaturedPlayLists(data);
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
      });
  }
  const getFollowedArtists = async () => {
    const limit = 10;
    // Corrected the query parameter for limit from $limit to limit
    const url = `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`;

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${spotify_access_token}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      // Assuming the structure of the response has artists.items
      return data.artists.items;
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
      return []; // Return an empty array in case of error
    }
  };

  const fetchRecommendedArtists = async () => {

    const followed_artists: SpotifyArtist[] = await getFollowedArtists();
    const followed_artists_ids = followed_artists.map(e => e.id);
    var recommendedArtistsResult: SpotifyArtist[] = [];
    // console.log(`Here are the followed artists:`,);
    for (let index = 0; index < followed_artists_ids.length; index++) {
      const artists_id = followed_artists_ids[index];
      const url = `https://api.spotify.com/v1/artists/${artists_id}/related-artists`;

      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${spotify_access_token}`,
          'Content-Type': 'application/json'
        }
      };

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: SpotifyArtistsData = await response.json();
        // console.log('Recommended Artists:', data);
        recommendedArtistsResult = [...recommendedArtistsResult, ...data.artists];
      } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
      }

    }
    setRecommendedArtists(recommendedArtistsResult);
  };

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    await loadAccessToken();
    handleLoginRedirect();

  }

  useEffect(() => {
    getUserFavorites();
  }, [spotifyUser]);

  useEffect(() => {
    if (!newAlbums)
      fetchNewReleaseAlbums();
    if (!featuredPlayLists)
      fetchFeaturedPlaylists();
    if (!recommendedArtists)
      fetchRecommendedArtists();

  }, [selectedItem])

  const renderContent = () => {


    switch (selectedItem) {
      case "New Albums":
        if (!newAlbums) return (<></>);
        const a = 20;
        return (
          <>
            <p style={{ fontSize: 40, fontWeight: 1000 }}>Top {a} albums</p>
            <br />
            <ul className="list-none p-0">
              {newAlbums.map((a, index) => {
                var album_image = '';
                var artists_name = '';
                if (a.images.length > 0) {
                  var image = a.images[0];
                  if (image) {
                    album_image = image.url;
                  }
                }

                if (a.artists.length > 0) {
                  var artists = a.artists;

                  artists_name = artists.map(c => c.name).join(', ').toString();

                }


                return (
                  <li key={index} className="row flex items-center gap-4 mb-4">
                    <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                    <Image style={{ borderRadius: 10 }} src={album_image} alt="" width={100} height={100} quality={100} />
                    <div>
                      <p style={{ fontSize: 20 }}>{a.name}</p>
                      <p style={{ fontSize: 15 }}>{artists_name}</p>
                    </div>
                    <Button onPress={() => {
                      window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                    }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                      <SpotifyLogo></SpotifyLogo>

                    </Button>
                    {!(favoritesAlbums && favoritesAlbums.some((e) => e.data_id == a.id)) ?
                      <Tooltip color="foreground" content={`Add in Bookmark`}>
                        <Button onPress={() => {
                          addUserFavorite(a.type, a, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <BookmarksDisabled></BookmarksDisabled>

                        </Button>
                      </Tooltip> :
                      <Tooltip color="foreground" content={`Remove from Bookmark`}>
                        <Button onPress={() => {
                          removeUserFavorite(a.type, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <Bookmarks></Bookmarks>

                        </Button>
                      </Tooltip>

                    }

                    <Tooltip color="foreground" content={`Open in player`}>
                      <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                    </Tooltip>
                  </li>
                )
              })}
            </ul >
          </>
        );
      case "Featured playlists":
        if (!featuredPlayLists) return (<></>);
        var featured_name = featuredPlayLists.message;
        return (
          <>
            <p style={{ fontSize: 40, fontWeight: 1000 }}> {featured_name}</p>
            <br />
            <ul className="list-none p-0">
              {featuredPlayLists.playlists.items.map((a, index) => {
                var album_image = '';
                if (a.images.length > 0) {
                  var image = a.images[0];
                  if (image) {
                    album_image = image.url;
                  }
                }

                return (
                  <li key={index} className="row flex items-center gap-4 mb-4">
                    <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                    <Image style={{ borderRadius: 10 }} src={album_image} alt="" width={100} height={100} quality={100} />
                    <div>
                      <p style={{ fontSize: 20 }}>{a.name}</p>
                      <p style={{ fontSize: 13, maxWidth: 400, color: "#FFFFFF", opacity: 0.5 }}>{a.description}</p>
                    </div>
                    <Button onPress={() => {
                      window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                    }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                      <SpotifyLogo></SpotifyLogo>

                    </Button>
                    {!(favoritesPlaylists && favoritesPlaylists.some((e) => e.data_id == a.id)) ?
                      <Tooltip color="foreground" content={`Add in Bookmark`}>
                        <Button onPress={() => {
                          addUserFavorite(a.type, a, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <BookmarksDisabled></BookmarksDisabled>

                        </Button>
                      </Tooltip> :
                      <Tooltip color="foreground" content={`Remove from Bookmark`}>
                        <Button onPress={() => {
                          removeUserFavorite(a.type, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <Bookmarks></Bookmarks>

                        </Button>
                      </Tooltip>

                    }
                    <Tooltip color="foreground" content={`Open in player`}>
                      <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                    </Tooltip>
                  </li>
                )
              })}
            </ul>
          </>
        );
      case "Recommended Artists": // user top items
        if (!recommendedArtists) return (<></>);

        return (
          <>
            <p style={{ fontSize: 40, fontWeight: 1000 }}> {'Recommended artists'}</p>
            <br />
            <ul className="list-none p-0">
              {recommendedArtists.map((a, index) => {
                var artist_image = '';
                if (a.images.length > 0) {
                  var image = a.images[0];
                  if (image) {
                    artist_image = image.url;
                  }
                }

                return (
                  <li key={index} className="row flex items-center gap-4 mb-4">
                    <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                    <Image style={{ borderRadius: 10 }} src={artist_image} alt="" width={100} height={100} quality={100} />
                    <Tooltip color="foreground" content={`This artist was ${a.popularity}% famous`}>
                      <div>
                        <p style={{ fontSize: 20 }}>{a.name}</p>
                        <div style={{ backgroundColor: "#1db954", borderRadius: 5, paddingLeft: 10, paddingRight: 10, width: 'fit-content' }}>
                          <p style={{ fontSize: 15 }}>{a.popularity}%</p>
                        </div>
                        <p style={{ fontSize: 15 }}>Fans {a.followers.total}</p>
                      </div>
                    </Tooltip>
                    <Tooltip color="foreground" content={`Open in Spotify`}>
                      <Button onPress={() => {
                        window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                      }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                        <SpotifyLogo></SpotifyLogo>

                      </Button>
                    </Tooltip>

                    {!(favoritesArtists && favoritesArtists.some((e) => e.data_id == a.id)) ?
                      <Tooltip color="foreground" content={`Add in Bookmark`}>
                        <Button onPress={() => {
                          addUserFavorite(a.type, a, a.id);
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <BookmarksDisabled></BookmarksDisabled>

                        </Button>
                      </Tooltip> :
                      <Tooltip color="foreground" content={`Remove from Bookmark`}>
                        <Button onPress={() => {
                          removeUserFavorite(a.type, a.id);
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <Bookmarks></Bookmarks>

                        </Button>
                      </Tooltip>
                    }
                    <Tooltip color="foreground" content={`Open in player`}>
                      <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                    </Tooltip>
                  </li>

                )
              })}
            </ul>
          </>
        );

      case "Bookmarks":
        return (
          <>
            <div>
              <p style={{ fontSize: 40, fontWeight: 1000 }}> {'Saved Albums'}</p>
              <br />
              {favoritesAlbums && favoritesAlbums.map((aa: SpotifyFavorite, index) => {
                var a: SpotifyAlbum = aa.data;
                var album_image = '';
                var artists_name = '';
                if (a.images.length > 0) {
                  var image = a.images[0];
                  if (image) {
                    album_image = image.url;
                  }
                }

                if (a.artists.length > 0) {
                  var artists = a.artists;

                  artists_name = artists.map(c => c.name).join(', ').toString();

                }


                return (
                  <li key={index} className="row flex items-center gap-4 mb-4">
                    <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                    <Image style={{ borderRadius: 10 }} src={album_image} alt="" width={100} height={100} quality={100} />
                    <div>
                      <p style={{ fontSize: 20 }}>{a.name}</p>
                      <p style={{ fontSize: 15 }}>{artists_name}</p>
                    </div>
                    <Button onPress={() => {
                      window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                    }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                      <SpotifyLogo></SpotifyLogo>

                    </Button>
                    {!(favoritesAlbums && favoritesAlbums.some((e) => e.data_id == a.id)) ?
                      <Tooltip color="foreground" content={`Add in Bookmark`}>
                        <Button onPress={() => {
                          addUserFavorite(a.type, a, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <BookmarksDisabled></BookmarksDisabled>

                        </Button>
                      </Tooltip> :
                      <Tooltip color="foreground" content={`Remove from Bookmark`}>
                        <Button onPress={() => {
                          removeUserFavorite(a.type, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <Bookmarks></Bookmarks>

                        </Button>
                      </Tooltip>
                    }
                    <Tooltip color="foreground" content={`Open in player`}>
                      <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                    </Tooltip>
                  </li>
                )
              })}
              <p style={{ fontSize: 40, fontWeight: 1000 }}> {'Saved Playlist'}</p>
              <br />
              {favoritesPlaylists && favoritesPlaylists.map((aa: SpotifyFavorite, index) => {
                var a: SpotifyPlaylist = aa.data;
                var album_image = '';
                if (a.images.length > 0) {
                  var image = a.images[0];
                  if (image) {
                    album_image = image.url;
                  }
                }

                return (
                  <li key={index} className="row flex items-center gap-4 mb-4">
                    <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                    <Image style={{ borderRadius: 10 }} src={album_image} alt="" width={100} height={100} quality={100} />
                    <div>
                      <p style={{ fontSize: 20 }}>{a.name}</p>
                      <p style={{ fontSize: 13, maxWidth: 400, color: "#FFFFFF", opacity: 0.5 }}>{a.description}</p>
                    </div>
                    <Button onPress={() => {
                      window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                    }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                      <SpotifyLogo></SpotifyLogo>

                    </Button>
                    {!(favoritesPlaylists && favoritesPlaylists.some((e) => e.data_id == a.id)) ?
                      <Tooltip color="foreground" content={`Add in Bookmark`}>
                        <Button onPress={() => {
                          addUserFavorite(a.type, a, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <BookmarksDisabled></BookmarksDisabled>

                        </Button>
                      </Tooltip> :
                      <Tooltip color="foreground" content={`Remove from Bookmark`}>
                        <Button onPress={() => {
                          removeUserFavorite(a.type, a.id)
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                          <Bookmarks></Bookmarks>

                        </Button>
                      </Tooltip>
                    }
                    <Tooltip color="foreground" content={`Open in player`}>
                      <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                    </Tooltip>

                  </li>
                )
              })}
              <p style={{ fontSize: 40, fontWeight: 1000 }}> {'Saved Artist'}</p>
              <br />
              <ul className="list-none p-0">
                {favoritesArtists && favoritesArtists.map((aa: SpotifyFavorite, index) => {
                  var a: SpotifyArtist = aa.data;
                  var artist_image = '';
                  if (a.images.length > 0) {
                    var image = a.images[0];
                    if (image) {
                      artist_image = image.url;
                    }
                  }

                  return (
                    <li key={index} className="row flex items-center gap-4 mb-4">
                      <p style={{ width: 40, fontSize: 20 }}>{index + 1}</p>
                      <Image style={{ borderRadius: 10 }} src={artist_image} alt="" width={100} height={100} quality={100} />
                      <Tooltip color="foreground" content={`This artist was ${a.popularity}% famous`}>
                        <div>
                          <p style={{ fontSize: 20 }}>{a.name}</p>
                          <div style={{ backgroundColor: "#1db954", borderRadius: 5, paddingLeft: 10, paddingRight: 10, width: 'fit-content' }}>
                            <p style={{ fontSize: 15 }}>{a.popularity}%</p>
                          </div>
                          <p style={{ fontSize: 15 }}>Fans {a.followers.total}</p>
                        </div>
                      </Tooltip>
                      <Tooltip color="foreground" content={`Open in Spotify`}>
                        <Button onPress={() => {
                          window.open(a.external_urls.spotify, '_blank', 'noopener,noreferrer')
                        }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#1db954' }}>
                          <SpotifyLogo></SpotifyLogo>

                        </Button>
                      </Tooltip>

                      {!(favoritesArtists && favoritesArtists.some((e) => e.data_id == a.id)) ?
                        <Tooltip color="foreground" content={`Add in Bookmark`}>
                          <Button onPress={() => {
                            addUserFavorite(a.type, a, a.id);
                          }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                            <BookmarksDisabled></BookmarksDisabled>

                          </Button>
                        </Tooltip> :
                        <Tooltip color="foreground" content={`Remove from Bookmark`}>
                          <Button onPress={() => {
                            removeUserFavorite(a.type, a.id);
                          }} isIconOnly color="warning" variant="faded" aria-label="Play in Spotify" style={{ backgroundColor: '#000000', borderColor: '#000000' }}>
                            <Bookmarks></Bookmarks>

                          </Button>
                        </Tooltip>
                      }
                      <Tooltip color="foreground" content={`Open in player`}>
                        <Button style={{ borderRadius: 999, backgroundColor: '#1db954', fontWeight: 500, height: 30 }} onClick={() => { setPlayerLink(a.external_urls.spotify); setOpenPlayer(true) }} >Play</Button>
                      </Tooltip>
                    </li>

                  )
                })}
              </ul>
            </div>
          </>
        )
      default:
        return null;
    }
  };



  return (


    <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: '#000000', color: 'white' }}>


      <Modal isOpen={!spotifyUser ? true : false} onOpenChange={() => { }} style={{ backgroundColor: '#000000', color: '#FFFFFF' }} hideCloseButton={true}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Welcome,</ModalHeader>
              <ModalBody>
                <img src={loginAnimated.src} width={100} height={100}></img>

                <p>
                  You need to login Spotify to use this website
                </p>
              </ModalBody>
              <ModalFooter>

                <Button onClick={login} style={{ backgroundColor: '#1d703a', color: '#1db954', fontWeight: 800 }}>Login</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {openPlayer && playerLink != undefined &&
        <Spotify wide style={{ position: 'fixed', zIndex: 1, bottom: 0, width: 400, margin: 10 }} link={playerLink!} />
      }


      <Navbar
        style={{ backgroundColor: 'black' }}
        classNames={{
          item: [
            "flex",
            "relative",
            "h-full",
            "items-center",
            "data-[active=true]:after:content-['']",
            "data-[active=true]:after:absolute",
            "data-[active=true]:after:bottom-0",
            "data-[active=true]:after:left-0",
            "data-[active=true]:after:right-0",
            "data-[active=true]:after:h-[2px]",
            "data-[active=true]:after:rounded-[2px]",
            "data-[active=true]:after:bg-primary",
          ],
        }}
      >
        <NavbarBrand>
          <p className="font-bold text-inherit" style={{ color: "#1db954", fontSize: 20 }}>Spotify</p>
          <p className="font-bold text-inherit" style={{ fontSize: 20 }}>-Top</p>
        </NavbarBrand>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <Link href="#" onClick={() => setSelectedItem("New Albums")} style={(selectedItem == 'New Albums') ? { color: '#1db954', fontWeight: '800' } : {}}>
              New Albums
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="#" onClick={() => setSelectedItem("Featured playlists")} style={(selectedItem == 'Featured playlists') ? { color: '#1db954', fontWeight: '800' } : {}}>
              Featured playlists
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="#" onClick={() => setSelectedItem("Recommended Artists")} style={(selectedItem == 'Recommended Artists') ? { color: '#1db954', fontWeight: '800' } : {}}>
              Recommended Artists
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="#" onClick={() => setSelectedItem("Bookmarks")} style={(selectedItem == 'Bookmarks') ? { color: '#1db954', fontWeight: '800' } : {}}>
              Bookmarks
            </Link>
          </NavbarItem>
          {spotifyUser ?
            <Tooltip color="foreground" content={`Logout from ${spotifyUser.display_name}`}>
              <NavbarItem>
                <Button style={{ fontWeight: 800, backgroundColor: '#1d703a', color: '#1db954' }} href="#" onClick={() => logout()} >
                  {spotifyUser.display_name}
                </Button>
              </NavbarItem>
            </Tooltip>
            :
            <NavbarItem>
              <Link href="#" onClick={() => login()} color="foreground">
                Login
              </Link>
            </NavbarItem>
          }
        </NavbarContent>
      </Navbar>

      {/* body */}
      <br />
      {renderContent()}
    </main>
  );
}