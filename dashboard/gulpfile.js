'use strict';

var gulp = require('gulp');
var fs = require('fs');
var _path = require('path');

// var wrench = require('wrench');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */

 function readDir(baseDir) {
     baseDir = baseDir.replace(/\/$/, '');

     var readdirSyncRecursive = function(baseDir) {
         var files = [],
             curFiles,
             nextDirs,
             isDir = function(fname){
                 return fs.existsSync(_path.join(baseDir, fname)) ? fs.statSync( _path.join(baseDir, fname) ).isDirectory() : false;
             },
             prependBaseDir = function(fname){
                 return _path.join(baseDir, fname);
             };

         curFiles = fs.readdirSync(baseDir);
         nextDirs = curFiles.filter(isDir);
         curFiles = curFiles.map(prependBaseDir);

         files = files.concat( curFiles );

         while (nextDirs.length) {
             files = files.concat( readdirSyncRecursive( _path.join(baseDir, nextDirs.shift()) ) );
         }

         return files;
     };

     // convert absolute paths to relative
     var fileList = readdirSyncRecursive(baseDir).map(function(val){
         return _path.relative(baseDir, val);
     });

     return fileList;
 };


readDir('./gulp').filter(function(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function(file) {
  require('./gulp/' + file);
});

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
