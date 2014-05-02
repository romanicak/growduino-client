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
        tmpindex: {
            cwd: 'src',
            src: ['index.html'],
            dest: '.tmp',
            expand: true
        },
        nouglify: {
            files: [
                {dest: 'dist/js/settings.js', src: 'src/js/settings.js'},
                {dest: 'dist/js/app.js', src: 'src/js/app.js'},
                // {
                //     cwd: 'src',
                //     src: ['libs/**/*.js'],
                //     dest: 'dist',
                //     expand: true
                // },
                {
                    cwd: 'src',
                    src: ['images/*'],
                    dest: 'dist',
                    expand: true
                }
                //TODO need 8.3 names
                // {
                //     cwd: 'bower_components/bootstrap/fonts',
                //     src: ['*'],
                //     dest: 'dist/fonts/',
                //     expand: true
                // }
            ]
        },
        bower: {
            files: [
                {dest: 'bower83/jquery.js', src: 'bower_components/jquery/dist/jquery.min.js'},
                {dest: 'bower83/angular.js', src: 'bower_components/angular/angular.min.js'},
                {dest: 'bower83/ngres.js', src: 'bower_components/angular-resource/angular-resource.min.js'},
                {dest: 'bower83/ngroute.js', src: 'bower_components/angular-route/angular-route.min.js'},
                {dest: 'bower83/bs.js', src: 'bower_components/bootstrap/dist/js/bootstrap.min.js'},
                {dest: 'bower83/bs.css', src: 'bower_components/bootstrap/dist/css/bootstrap.min.css'},
                {dest: 'bower83/hicharts.js', src: 'bower_components/highcharts.com/js/highcharts.src.js'},
                {dest: 'bower83/moment.js', src: 'bower_components/moment/min/moment.min.js'},
            ]
        },
        bowerdist: {
            cwd: 'bower83/',
            src: ['*.js', '*.css'],
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
            // options: {
            //     process: function(src, filepath) {
            //         if (filepath == '.tmp/templates.js') {
            //             return 'define("ngtemplates",[\'app\', \'angular\'],function(){\n'+src+'\n});';
            //         } else {
            //             return src;
            //         }
            //     },
            // },
            src: ['.tmp/templates.js', '.tmp/uglify.js'],
            dest: 'dist/js/minified.js'
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
                '.tmp/index2.html': '.tmp/index.html'
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
    uglify: {
        // options: {
        //     beautify: true
        // },
        app: {
          files: {
            '.tmp/uglify.js': [
                "src/js/services/utils.js",
                "src/js/services/requests.js",
                "src/js/services/resources.js",
                "src/js/services/divisors.js",
                "src/js/services/Trigger.js",
                "src/js/services/Alert.js",
                "src/js/controllers/NavigationController.js",
                "src/js/controllers/ChartController.js",
                "src/js/controllers/SettingsController.js",
                "src/js/controllers/RelayController.js",
                "src/js/controllers/TriggersController.js",
                "src/js/controllers/AlertsController.js",
                "src/js/directives/bsHasError.js",
            ],
            '.tmp/yepnope.load.js': ["src/js/yepnope.load.js"]
          }
        },
        libs: {
            files: {
                'dist/js/libs.js': [
                    "src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.js",
                    "src/libs/async.js"
                ]
            }
        }
    },
    'string-replace': {
        dist: {
            files: {
                'dist/index.htm': '.tmp/index2.html'
            },
            options: {
              replacements: [
                {
                    pattern: '<link rel="stylesheet" href="css/minified.css">',
                    // replacement: "<style>\n"+
                    //     "<%= grunt.file.read('src/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.css') %>\n"+
                    //     "<%= grunt.file.read('src/css/base.css') %>\n"+
                    //     "</style>"
                    replacement: function (match, p1, offset, string) {
                        var css = grunt.file.read('dist/css/minified.css');
                        css = css.replace('../images/', 'images/');
                        return "<style>\n"+ css + "</style>";
                    }
                },
                {
                    pattern: '<script src="/bower_components/yepnope/yepnope.js"></script>',
                    replacement: "<script>\n"+
                        "<%= grunt.file.read('bower_components/yepnope/yepnope.1.5.4-min.js') %>\n"+
                        "</script>"
                },
                {
                    pattern: '<script src="js/yepnope.load.js"></script>',
                    replacement: function (match, p1, offset, string) {
                        return "<script>\n"+ grunt.file.read('.tmp/yepnope.load.js') + "</script>";
                    }
                },
                {
                    //temporaty HACK
                    pattern: '<script>var DIST = false;</script>',
                    replacement: "<script>var DIST = true;</script>"
                },
              ]
            }
        }
    }
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
grunt.loadNpmTasks('grunt-string-replace');

grunt.registerTask('default', ['watch']);
grunt.registerTask('bower', ['copy:bower']);
//grunt.registerTask('distUsemin', ['watch']);
grunt.registerTask('dist', [
    'clean:dist',
    'copy:bower', 'copy:bowerdist',
    'copy:tmpindex', 'copy:nouglify',
    'useminPrepare', 'ngtemplates', 'concat:generated', 'cssmin', 'uglify', 'usemin',
    'concat:templates',
    /*'targethtml:dist',*/ 'htmlmin:index', 'string-replace', 'clean:tmp'
]);
grunt.registerTask('distfish', ['dist', 'copy:distfish']);

//TODO remove htmlmin, it is now quite useless when using string-replace!

};
