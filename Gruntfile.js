"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({


    clean: {
        dev: {
          src: ['output', 'dist'],
        },
      },

    copy: {
          main: {
            files: [

              {expand: true, src: ['js/**'], dest: 'dist/'},

              {expand: true, src: ['./*'], dest: 'dist/', filter: 'isFile'},

              {expand: true, src: ['./Gruntfile.js', './package.json'], dest: 'output/'}
            ],
          },
        },
    htmlmin: {                                     // Task
      dist: {                                      // Target
        options: {                                 // Target options
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true
        },
        files: {
          'output/index.html': 'dist/index.html',    // 'destination': 'source'
        }
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      my_target: {
        files: {
          'output/js/main.js': ['dist/js/main.js'],
          'output/js/oauth-signature.js': ['dist/js/oauth-signature.js']
        }
      }
    },
    watch: {
      files: ['**/*'],
      tasks: ['default'],
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

   // Default task(s).
  grunt.registerTask('default', ['clean', 'copy', 'htmlmin', 'uglify', 'watch']);

};