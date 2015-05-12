var exec = require('child_process').exec; 

 function mpc(io, config) {
    return function(){
        exec('mpc current',function(err,stdout,stderr) {
            if(err) throw err;
            if(stdout) {
                io.emit('song',stdout.toString('utf8'));
            }
        });
    }
};

function itunes(io, config) {
    var osascript = require('node-osascript');

    // start with true to prevent from getting info when we haven't checked if iTunes is running
    var paused = true;

    // prevent from loading in each call to iTunesInfo
    var infoCmd = 'tell application "iTunes" to ' +
                '{ artist of current track as string, ' +
                'name of current track as string }';



    var iTunesInfo = function() {
        // iTunes throws an error if it's paused and we try to obtain the current song
        osascript.execute('tell app "iTunes" to get player state as string', function(err, stdout, stderr) {
            var state = stdout.toString('utf8');
            paused = state === 'paused' || state === 'stopped';
        });

        if(paused) {
           return;
        }

        osascript.execute(infoCmd, function(err,stdout,stderr) {
            if(err) {
                throw err;
            }
            if(stdout) {
                io.emit('song',stdout.join(' - ').toString('utf8'));
            }
        });
    };


    return function(){
        osascript.execute('tell app "System Events" to count processes whose name is "iTunes"', function(err, stdout, stderr) {
            if(stdout)
                iTunesInfo();
        });
    }
};

module.exports = function(io, config) {
    if(config.musicplayer == 'mpc') {
        return mpc(io, config);
    } else {
        return itunes(io, config);
    }
}
