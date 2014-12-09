var libPath = process.env.COVER == 'CMNDR' ? './lib-cov' : './lib';

module.exports = require(libPath + '/main');