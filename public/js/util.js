Util = Object.freeze({
    log: console.log.bind(console),

    reviveDataset: function(dataset) {
        var ret = [ ];
        dataset.values.forEach(function(valList) {
            var obj = { };
            valList.forEach(function(item, index) {
                obj[dataset.properties[index]] = item;
            });
            ret.push(obj);
        });
        return ret;
    },

    applyUpdate: function(orig, update) {
        for (var prop in orig) {
            if (orig.hasOwnProperty(prop) && update.hasOwnProperty(prop)) {
                orig[prop] = update[prop];
            }
        }
    },

    extractProperties: function(source, propNames) {
        var ret = { };
        for (var i = 0; i < propNames.length; i++) {
            if (source.hasOwnProperty(propNames[i])) {
                ret[propNames[i]] = source[propNames[i]];
            }
        }
        return ret;
    },

    shallowCopy: function(source) {
        var ret = { };
        for(var prop in source) {
            if(source.hasOwnProperty(prop)) { ret[prop] = source[prop]; }
        }
        return ret;
    },

    Publisher: function () {
        var subs = [ ];

        this.subscribe = function(callback) {
            subs.push(callback);

            return {
                cancel: function() {
                    subs.splice(subs.indexOf(callback), 1);
                }
            };
        };

        this.publish = function(arg) {
            for(var i = 0; i < subs.length; i++) { subs[i](arg); }
        };
    }
});

Convert = Object.freeze({
    toNumberLax: function(v) {
        var k = 1 * v;
        return ((v || v === 0) && (k || k === 0)) ? k : null;
    },
    toNumberStrict: function(v) {
        var k = this.toNumberLax(v);
        if (k === null) { throw TypeError('Conversion failed on object: '+v); }
        return k;
    },
    toBoolLax: function(v) {
        var k = this.toNumberLaz(v);
        return (k === null) ? null : !!k;
    },
    toBoolStrict: function(v) {
        return !!v;
    },
    toStringLax: function(v) {
        return (v === null || v === undefined || isNan(v)) ? null : JSON.stringify(v);
    },
    toStringStrict: function(v) {
        var k = this.toStringLax(v);
        if (k === null) { throw TypeError('Conversion failed on object: '+v); }
        return k;
    },
    toIntLax: function(v) {
        var k = this.toNumberLax(v);
        return (k === null) ? null : Math.round(k);
    },
    toIntStrict: function(v) {
        return Math.round(this.toNumberStrict(v));
    }
});