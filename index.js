var trackInfo = require('./core/trackInfo');
var updateTags = require('./core/updateTags');
var scanTracks = require('./core/scanTracks');
var path = require('path');
const config = require('./config.json');
const FOLDER = config.folder;

/*trackInfo('TWO FEET - Lost The Game').then(data => {
    console.log(data);
}).catch(err => {
    console.log(err);
});*/

var tracksList, total, current = null;

var updateTrack = () => {
    current++;
    var src = tracksList.pop();
    var title = path.basename(src, path.extname(src));

    console.log(`UPDATING "${title}" [${current} of ${total}]`);

    trackInfo(title).then(data => {
        console.log("Writing ID3 tags...");

        updateTags(src, data).then(result => {
            console.log("DONE.");

            // Recursively update tracks in order
            if(tracksList.length > 0) updateTrack();
            else console.log("FINISHED updating queue.");
        }).catch(e => {
            console.log("Failed to update ID3 tags: ", e);
        });
    }).catch(err => {
        console.log("SKIPPING due to error: ", err);

        // Recursively update tracks in order
        if(tracksList.length > 0) updateTrack();
        else console.log("FINISHED updating queue.");
    });
    
};

scanTracks(FOLDER).then(tracks => {

    tracksList = tracks;
    total = tracks.length;
    current = 0;
    updateTrack();

}).catch(e => {
    console.log("Failed to scan folder for MP3 files: ", e);
});