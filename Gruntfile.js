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
        // libs: {
        //     cwd: 'src',
        //     src: ['libs/**/*.js'],
        //     dest: 'dist',
        //     expand: true
        // },
        index: {
            cwd: 'src',
            src: ['index.html'],
            dest: '.tmp',
            expand: true
        },
        settings: {
            src: ['src/js/settings.js'],
            dest: 'dist/js/settings.js'
        },
        bower: {
            files: [
                {dest: 'bower83/require.js', src: 'bower_components/requirejs/require.js'},
                {dest: 'bower83/jquery.js', src: 'bower_components/jquery/dist/jquery.min.js'},
                {dest: 'bower83/angular.js', src: 'bower_components/angular/angular.min.js'},
                {dest: 'bower83/ngres.js', src: 'bower_components/angular-resource/angular-resource.min.js'},
                {dest: 'bower83/ngroute.js', src: 'bower_components/angular-route/angular-route.min.js'},
                {dest: 'bower83/bs.js', src: 'bower_components/bootstrap/dist/js/bootstrap.min.js'},
                {dest: 'bower83/hicharts.js', src: 'bower_components/highcharts.com/js/highcharts.src.js'},
                {dest: 'bower83/moment.js', src: 'bower_components/moment/min/moment.min.js'},
            ]
        },
        bowerdist: {
            cwd: 'bower83/',
            src: ['*.js'],
            dest: 'dist/bower/',
            expand: true
        },
        distfish: {
            files: [
                {src: 'src/js/settings_fish.js', dest: 'dist/js/settings.js'}
            ]
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
            src: ['.tmp/templates.js', '.tmp/init.js'],
            dest: 'dist/js/init.js'
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
            name: "init", // assumes a production build using almond
            out: ".tmp/init.js",
            paths: {
                jquery: "empty:",
                angular: "empty:",
                angular_resource: "empty:",
                angular_route: "empty:",
                bootstrap: "empty:",
                highcharts: "empty:",
                moment: "empty:",
                settings: "empty:",
                // bootstrap_datetimepicker: "empty:",
                // bootstrap_datetimepicker_cs: "empty:",
                // async: "empty:",
                bootstrap_datetimepicker: __dirname+'/src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker',
                bootstrap_datetimepicker_cs: __dirname+'/src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.cs',
                async: __dirname+'/src/libs/async',

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
//grunt.registerTask('distUsemin', ['watch']);
grunt.registerTask('dist', [
    'clean:dist',
    'copy:images', 'copy:index', 'copy:settings', 'copy:bower', 'copy:bowerdist',
    'useminPrepare', 'ngtemplates', 'concat:generated', 'cssmin', /*'uglify', */'usemin', 'requirejs',
    'concat:templates',
    /*'targethtml:dist',*/ 'htmlmin:index', 'clean:tmp'
]);
grunt.registerTask('distfish', ['dist', 'copy:distfish']);

};