module.exports = (grunt) ->

  grunt.initConfig 
    pkg: grunt.file.readJSON './package.json'
    coffee:
      compile:
        files:
          './index.js': './index.iced'

    uglify: 
      options: 
        banner: '/*! <%= pkg.name %>-node <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      build: 
        src: './index.js',
        dest: './index.min.js' 

  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-iced-coffee'

  grunt.registerTask 'default', ['coffee', 'uglify']