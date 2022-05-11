const id3 = require('node-id3')
const request = require('request');
const fs = require('fs');

// Make sure temporary image folder exists
if (!fs.existsSync('./tmp')){
    fs.mkdirSync('./tmp');
}

// Utility function to download track/album art from URL
var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body) {    
        if(err) {
            return callback(err);
        }

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

module.exports = (src, data) => {
    return new Promise((resolve, reject) => {

        // Download track/album art
        console.info("Downloading track/album art...");
        download(data.images[0], './tmp/track.jpg', function(err) {

            if(err) {
                return reject(err);
            }

            var tags = {
                
                // Track Title
                title: data.track.name,

                // Track Contributing Artist
                artist: data.track.artistName,

                // Track Original Artist
                originalArtist: data.track.artistName,

                // Song/Album Art
                APIC: "./tmp/track.jpg"

            }

            // Album Title
            if(data.track.albumName != null || (data.album && data.album.title)) tags.album = data.track.albumName != null ? data.track.albumName : data.album.title;
        
            if(data.album != null) {

                // Release Date
                tags.year = data.album.year;

                // Genre
                tags.genre = data.album.genre.join("; ") + ";";

            }

            var success = id3.write(tags, src);
            if(success == true) {
                fs.unlinkSync('./tmp/track.jpg');
                return resolve();
            }else {
                return reject(success);
            }

        });

    });
};