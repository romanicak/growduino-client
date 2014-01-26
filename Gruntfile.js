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
        tmp: {
            src: ['.tmp']
        }
    },
    copy: {
        dist: {
            cwd: 'src',
            src: [ 'images/*', 'partials/*'],
            dest: 'dist',
            expand: true
        },
        htmltmp: {
            cwd: 'src',
            src: [ 'index.html' ],
            dest: '.tmp',
            expand: true
        }
    },
    htmlmin: {
        dist: {
            options: {
                collapseBooleanAttributes:      true,
                collapseWhitespace:             true,
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
            src:      'src/partials/**/*.html',
            dest:     '.tmp/template.js',
            options:  {
                usemin: 'dist/js/minified.js'
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

// Register the default tasks.
grunt.registerTask('default', ['watch']);
//grunt.registerTask('dist', ['clean', 'copy', 'htmlmin', 'cssmin', 'uglify']);
grunt.registerTask('dist', ['clean:dist', 'copy', 'useminPrepare', /*'ngtemplates',*/ 'concat', 'cssmin', 'uglify', 'usemin', 'htmlmin', 'clean:tmp']);

};