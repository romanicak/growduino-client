module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      /*css: {
        files: [
          '** /*.scss'
        ],
        tasks: ['sass']
      },*/
      js: {
        files: [
          'src/js/**/*.js',
          'Gruntfile.js'
        ],
        tasks: ['jshint']
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'src/js/**/*.js']
    },
    clean: {
      dist: {
        src: [ 'dist' ]
      },
    },
    copy: {
      dist: {
        cwd: 'src',
        src: [ 'images/*', 'partials/*', '*.htm' ],
        dest: 'dist',
        expand: true
      },
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        }
      },
      files: {
        'dist/index.htm': 'src/index.htm'
      }
    },
    cssmin: {
      dist: {
        files: {
          'dist/minified.css': [ 'src/libs/**/*.css', 'src/css/**/*.css' ]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/minified.js': [
            'src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js',
            'src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.cs.js',
            'src/libs.async.js',
            'src/js/utils.js',
            'src/js/app.js',
            'src/js/controllers/**/*.js'
          ]
        }
      }
    }
  });

  // Load the Grunt plugins.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Register the default tasks.
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('dist', ['clean', 'copy', 'htmlmin', 'cssmin', 'uglify']);
};