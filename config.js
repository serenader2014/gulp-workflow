module.exports = {
    csslint: {
        'box-sizing': false,
        'zero-units': false,
        'bulletproof-font-face': false
    },
    jshint: {
        node: true,
        browser: true,
        jquery: true,
        nomen: false,
        strict: false,
        sub: true,
        eqeqeq: true,
        laxbreak: true,
        bitwise: true,
        curly: true,
        forin: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        noempty: true,
        nonew: true,
        plusplus: true,
        regexp: true,
        undef: true,
        unused: true,
        trailing: true,
        indent: 4,
        onevar: true,
        white: true,
        globals: {
            angular: true
        }
    },
    htmlhint: {
        // 'id-unique': false
    }
};