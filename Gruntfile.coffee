path = require("path")
fs   = require("fs")
yaml = require("js-yaml")

module.exports = (grunt) ->

  # Grunt Tasks.
  @registerTask('default', ['jshint', 'jscs', 'uglify'])
  @registerTask('harvest', ['jshint', 'jscs', 'uglify', 'nodemon:harvest'])
  @registerTask('restore', ['clean', 'jshint', 'jscs', 'uglify'])
  @registerTask('serve', ['jshint', 'jscs', 'uglify', 'nodemon:serve'])
  @registerTask('debug', ['jshint', 'jscs', 'uglify', 'nodemon:debug'])
  @registerTask('export', ['jshint', 'jscs', 'uglify', 'nodemon:export'])

  # Grunt Tasks (Functions).

  # Read the YAML configuration.
  @registerTask 'readconfig', 'Read the Config.yml file.', (value) ->
    projectFile = "config/config.yml"
    unless grunt.file.exists(projectFile)
      grunt.log.error "file " + projectFile + " not found"
      return true
    project = grunt.file.readYAML(projectFile)
    console.log yaml.safeDump(project)

  # Update the YAML configuration.
  @registerTask 'updateconfig', 'Update the Config.yml file.', (value) ->
    projectFile = "config/config.yml"
    unless grunt.file.exists(projectFile)
      grunt.log.error "file " + projectFile + " not found"
      return true
    project = grunt.file.readYAML(projectFile)
    project.key.uuid = value
    grunt.file.write projectFile, yaml.safeDump(project)

  # Grunt Customizaton(s).
  grunt.util.linefeed = "\n"

  # Conf.
  grunt.initConfig

    limit: grunt.option('limit')

    clean:
      build:
        src: ["build", "config/files"]

    jscs:
      src: "lib/*.js",
      options:
        config: ".jscs.json"
        requireCurlyBraces: [ "if" ]

    jshint:
      all: ["lib/*.js"]
      options:
        esnext: true

    nodemon:
      harvest:
        script: "harvest.js"
        options:
          args: ['harvest', '<%= limit %>']
          cwd: "build"
          ignore: ['files/**', 'files/*']
          delay: 20
      serve:
        script: "harvest.js"
        options:
          args: ['serve']
          cwd: "build"
          ignore: ['files/**', 'files/*']
      debug:
        script: "harvest.js"
        options:
          args: ['serve']
          nodeArgs: ['--debug'],
          cwd: "build"
          ignore: ['files/**', 'files/*']
      export:
        script: "harvest.js"
        options:
          args: ['export']
          cwd: "build"
          ignore: ['files/**', 'files/*']

    pkg:
      grunt.file.readJSON("package.json")

    uglify:
      dynamic_mappings:
        files: [
          expand: true
          cwd: 'lib/'
          src: ['**/*.js']
          dest: 'build/'
        ]

    watch:
      scripts:
        files: ['lib/*.js']
        tasks: ['jshint']
        options:
          spawn: false

  # Required plugin(s).
  @loadNpmTasks "grunt-contrib-clean"
  @loadNpmTasks "grunt-contrib-jshint"
  @loadNpmTasks "grunt-contrib-watch"
  @loadNpmTasks "grunt-contrib-uglify"
  @loadNpmTasks "grunt-jscs"
  @loadNpmTasks "grunt-nodemon"

  # Load custom grunt tasks form the tasks directory
  # @loadTasks "tasks"

  @
