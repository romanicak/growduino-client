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
            src: ['dist']
        },
        tmp: {
            src: ['.tmp']
        }
    },
    copy: {
        images: {
            cwd: 'src',
            src: ['images/*'],
            dest: 'dist',
            expand: true
        },
        libs: {
            cwd: 'src',
            src: ['libs/**/*.js'],
            dest: 'dist',
            expand: true
        },
        index: {
            cwd: 'src',
            src: ['index.html'],
            dest: '.tmp',
            expand: true
        },
        settings: {
            src: ['src/js/settings.js'],
            dest: 'dist/js/settings.js'
        }
    },
    concat: {
        templates: {
            options: {
                process: function(src, filepath) {
                    if (filepath == '.tmp/templates.js') {
                        return 'define("ngtemplates",[\'app\', \'angular\'],function(){\n'+src+'\n});';
                    } else {
                        return src;
                    }
                },
            },
            src: ['.tmp/templates.js', '.tmp/growduino.js'],
            dest: 'dist/js/growduino.js'
        }
    },
    htmlmin: {
        index: {
            options: {
                collapseBooleanAttributes:      true,
                collapseWhitespace:             false,
                removeComments:                 true,
                removeScriptTypeAttributes:     true,
                removeStyleLinkTypeAttributes:  true
            },
            files: {
                'dist/index.htm': '.tmp/index.html'
            }
        }
    },
    useminPrepare: {
        html: '.tmp/index.html',
        options: {
            root: 'src'
        }
    },
    usemin: {
        html: '.tmp/index.html'
    },
    ngtemplates:  {
        dist:        {
            cwd:      'src',
            src:      'partials/**/*.html',
            dest:     '.tmp/templates.js',
            options:  {
                module: 'growduino',
                //usemin: 'dist/js/templates.js', //  todo add to minified
                htmlmin: {
                    collapseBooleanAttributes:      true,
                    collapseWhitespace:             false,
                    removeComments:                 true,
                    removeScriptTypeAttributes:     true,
                    removeStyleLinkTypeAttributes:  true
                }
            }
        }
    },
    requirejs: {
      compile: {
        options: {
            baseUrl: "src/js",
            //mainConfigFile: "src/js/requirejs.cfg.js",
            name: "growduino", // assumes a production build using almond
            out: ".tmp/growduino.js",
            paths: {
                jquery: "empty:",
                angular: "empty:",
                angular_resource: "empty:",
                angular_route: "empty:",
                bootstrap: "empty:",
                highcharts: "empty:",
                moment: "empty:",
                bootstrap_datetimepicker: "empty:",
                bootstrap_datetimepicker_cs: "empty:",
                async: "empty:",
                ngtemplates: "empty:"
                // bootstrap_datetimepicker: __dirname+'/src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker',
                // bootstrap_datetimepicker_cs: __dirname+'/src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.cs',
                // async: __dirname+'/src/libs/async'
            }
        }
      }
    },
    /*targethtml: {
      dist: {
        files: {
          '.tmp/index2.html': '.tmp/index.html'
        }
      }
    }*/
});

// Load the Grunt plugins.
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-jshint');

grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-htmlmin');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-angular-templates');
grunt.loadNpmTasks('grunt-usemin');
grunt.loadNpmTasks('grunt-contrib-requirejs');
grunt.loadNpmTasks('grunt-targethtml');

grunt.registerTask('default', ['watch']);
grunt.registerTask('distUsemin', ['watch']);
grunt.registerTask('dist', [
    'clean:dist', 'copy', 'useminPrepare', 'ngtemplates', 'concat:generated', 'cssmin', /*'uglify', */'usemin', 'requirejs',
    'concat:templates',
    /*'targethtml:dist',*/ 'htmlmin:index', 'clean:tmp'
]);

};