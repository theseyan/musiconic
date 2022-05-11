const glob = require("glob");

var getDirectories = function (src, callback) {
    glob(src + '/**/*.mp3', {nodir: true}, callback);
};

module.exports = (src) => {
    return new Promise((resolve, reject) => {
        getDirectories(src, function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};