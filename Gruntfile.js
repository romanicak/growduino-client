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
            dest:     '.tmp/template.js',
            options:  {
                module: 'growduino',
                usemin: 'dist/js/minified.js',
                htmlmin: {
                    collapseBooleanAttributes:      true,
                    collapseWhitespace:             false,
                    removeComments:                 true,
                    removeScriptTypeAttributes:     true,
                    removeStyleLinkTypeAttributes:  true
                }
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
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-angular-templates');
grunt.loadNpmTasks('grunt-usemin');

grunt.registerTask('default', ['watch']);
grunt.registerTask('distUsemin', ['watch']);
grunt.registerTask('dist', [
    'clean:dist', 'copy', 'useminPrepare', 'ngtemplates', 'concat', 'cssmin', 'uglify', 'usemin',
    'htmlmin:index', 'clean:tmp'
]);

};