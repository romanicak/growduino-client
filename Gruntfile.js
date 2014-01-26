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
            src: [ 'index.htm' ],
            dest: '.tmp',
            expand: true
        }
    },
    htmlmin: {
        dist: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            files: {
                'dist/index.htm': '.tmp/index.htm'
            }
        }
    },
    useminPrepare: {
        html: '.tmp/index.htm',
        options: {
            root: 'src'
        }
    },
    usemin: {
        html: '.tmp/index.htm'
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
grunt.loadNpmTasks('grunt-usemin');

// Register the default tasks.
grunt.registerTask('default', ['watch']);
//grunt.registerTask('dist', ['clean', 'copy', 'htmlmin', 'cssmin', 'uglify']);
grunt.registerTask('dist', ['clean:dist', 'copy', 'useminPrepare','concat', 'cssmin', 'uglify', 'usemin', 'htmlmin', 'clean:tmp']);

};