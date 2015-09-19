var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

exports.code = function(len) {
    var ret = '';
    for(var i = 0; i < len; i++) {
        ret += chars[Math.floor(Math.random() * chars.length)];
    };
    return ret;
};