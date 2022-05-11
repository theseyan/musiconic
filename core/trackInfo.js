const config = require('../config.json');
const Discogs = require('disconnect').Client;
const LastFM = require('last-fm');
const gis = require('g-i-s');

// Initialize API clients
var lastfm = new LastFM(config.keys.lastfm, { userAgent: config.userAgent });
var discogs = new Discogs(config.userAgent, config.keys.discogs).database();

module.exports = (track) => {
    return new Promise((resolve, reject) => {

        var finalData = {
            track: null,
            album: null,
            images: null
        };

        /*
         * Makes sure returned metadata always has images
         * Prefers Last.FM track images, uses Discogs album art otherwise, and falls back to Google Images if none are present
        */
        var handleImages = () => {
            if(finalData.images != null) return resolve(finalData);

            console.info("Could not find track/album art. Falling back to Google Images...");
            gis(finalData.track.artistName + ' ' + finalData.track.name, (err, results) => {
                if(err) {
                    console.info("Could not find track/album art on Google Images. Skipping track art altogether.");
                    return resolve(finalData);
                }

                finalData.images = [];
                for(var i=0; i<=2; i++) {
                    finalData.images.push(results[i].url);
                }
                return resolve(finalData);
            });
        };

        // Callback handler to Discogs album search
        var handleAlbumInfo = (err, album) => {
            if (err || album.pagination.items < 1) {
                console.info("Could not find album info for this track");

                return handleImages();
            }

            album = album.results[0];
            finalData.album = album;

            // Use Discogs album art
            if(finalData.images == null) {
                if(album.thumb != null || album.cover_image != null) {
                    finalData.images = [];
                    if(album.thumb != null) finalData.images.push(album.thumb);
                    if(album.cover_image != null) finalData.images.push(album.cover_image);
                }
            }

            return handleImages();
        };

        // Fetch accurate track title and artist
        lastfm.trackSearch({q: track, limit: 1}, (err, data) => {
            if (err || data.meta.total < 1) {
                return reject("Could not find basic track metadata" + (err ? "\nError: "+String(err) : ""));
            }

            data = data.result[0];

            // Fetch track info
            lastfm.trackInfo({name: data.name, artistName: data.artistName}, (err, track) => {
                if (err) {
                    return reject("Could not fetch full track information" + (err ? "\nError: "+String(err) : ""));
                }

                finalData.track = track;
                if(typeof track.images!="undefined" && track.images.length > 0) finalData.images = track.images.reverse();

                if(typeof track.albumName!="undefined") {
                    // Fetch Album info
                    discogs.search(track.albumName, {
                        type: 'release',
                        title: `${track.artistName} - ${track.albumname}`,
                        release_title: track.albumName,
                        //artist: track.artistName,
                    }, handleAlbumInfo);
                }else {
                    console.info("Album name absent in track metadata. Searching on Discogs...");
                    discogs.search(track.artistName + ' - ' + track.name, {
                        type: 'release'
                    }, handleAlbumInfo);
                }
            });
        });

    });
};