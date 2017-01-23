module.exports = (grunt) ->

  grunt.initConfig
    coffee:
      compile:
        files:
          './dist/stampery.js': './src/stampery.coffee'

    uglify:
      build:
        src: './dist/stampery.js'
        dest: './dist/stampery.min.js'

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'

  grunt.registerTask 'default', ['coffee', 'uglify']
