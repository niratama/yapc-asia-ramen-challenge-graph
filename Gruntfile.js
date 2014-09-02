/* global module, require */
module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        strict: true,
        indent: 2,
        maxlen: 80,
        unused: true,
        undef: true,
        browser: true,
        devel: true,
        debug: true,
        jquery: true
      },
      files: [
        'Gruntfile.js',
        'bower.json',
        'package.json',
        'src/js/*.js',
      ]
    },
    bower: {
      install: {
        options: {
          targetDir: 'static/vendor',
          layout: 'byComponent',
          cleanTargetDir: true
        }
      }
    },
    stylus: {
      options: {
        compress: true
      },
      main: {
        files: {
          'static/main.min.css': 'src/css/*.styl'
        }
      }
    },
    uglify: {
      main: {
        files: {
          'static/main.min.js': [
            'src/js/main.js'
          ]
        }
      }
    },
    copy: {
      html: {
        files: [
          { expand: true, cwd: 'src/', src: ['index.html'], dest: 'static/' }
        ]
      }
    },
    clean: {
      dist: [ 'static' ]
    },
    connect: {
      server: {
        options: {
          port: 3000,
          base: 'static'
        }
      }
    },
    watch: {
      jshint: {
        files: [ '<%= jshint.files %>' ],
        tasks: [ 'jshint' ]
      },
      html: {
        files: [ 'src/index.html' ],
        tasks: [ 'copy:html' ]
      },
      js: {
        files: [ 'src/js/*.js' ],
        tasks: [ 'uglify:main' ]
      },
      css: {
        files: [ 'src/css/*.styl' ],
        tasks: [ 'stylus:main' ]
      },
      bower: {
        files: [ 'bower.json' ],
        tasks: [ 'bower' ]
      },
    }
  });

  grunt.registerTask('test', [ 'jshint' ]);
  grunt.registerTask('build', [
    'bower', 'uglify:main', 'stylus:main', 'copy:html'
  ]);
  grunt.registerTask('default',
    [ 'test', 'build', 'connect', 'watch']);
};
/* vi:set sts=2 sw=2 et: */
