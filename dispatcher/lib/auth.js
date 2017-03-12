(function () {
    var indexOf = [].indexOf || function (item) {
                for (var i = 0, l = this.length; i < l; i++) {
                    if (i in this && this[i] === item) return i;
                }
                return -1;
            };

    var authorize = function (auth, config, callback) {
        var error, ref;
        if (auth === null || !auth.hasOwnProperty('identifier') || !auth.identifier.length <= 0) {
            error = new Error('invalid auth');
        } else if (!(ref = auth.identifier, indexOf.call(config.authenticClients, ref) >= 0)) {
            error = new Error('incorrect auth');
        }
        return callback(null);
    };

    module.exports = {
        authorize: authorize
    };

}).call(this);
