# global config:true, file:true, task:true, module: true

timer = require 'grunt-timer'
path = require 'path'
fs = require 'fs'

module.exports = (grunt) ->
  timer.init(grunt)

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    clean: ['build', 'output']
    coffee:
      build:
        files: [
          { src: ['**/*.coffee'], cwd: 'app', dest: 'build', ext: '.js', expand: true }
        ]
    concat:
      jail_iframe:
        src: [
          'build/js/jail_iframe/libs/*'
          'build/js/jail_iframe/core.js'
          'build/js/jail_iframe/wrap/first.js'
          'build/js/jail_iframe/classes/*.js'
          'build/js/jail_iframe/util/*.js'
          'build/js/jail_iframe/initializers/*.js'
          'build/js/jail_iframe/wrap/last.js'
        ]
        dest: 'build/js/jail_iframe.js'
    sass:
      build:
        options:
          bundleExec: true
          noCache: true #workaround for https://github.com/gruntjs/grunt-contrib-sass/issues/63
        files:
          'build/css/basic_without_embeds.css': 'app/css/basic.scss'
          'build/css/framed_controls_without_embeds.css': 'app/css/framed_controls.scss'
    cssUrlEmbed:
      encodeDirectly:
        files:
          'build/css/basic.css': ['build/css/basic_without_embeds.css']
          'build/css/framed_controls.css': ['build/css/framed_controls_without_embeds.css']
    cssmin:
      build:
        expand: true
        cwd: 'build/css/'
        dest: 'build/css/'
        src: '*.css'
        ext: '.min.css'
    uglify:
      options:
        preserveComments: (node, comment) -> !comment.value.lastIndexOf('@license', 0)
      jail_iframe:
        files:
          'build/js/jail_iframe.min.js':                        ['build/js/jail_iframe.js']
      factlink_loader:
        files:
          'build/js/loader/loader_common.min.js':       ['build/js/loader/loader_common.js']
    copy:
      dist:
        files: [
          { src: 'build/js/loader/loader_common.js', dest: 'output/factlink_loader.js' }
          { src: 'build/js/loader/loader_common.min.js', dest: 'output/factlink_loader.min.js' }
        ]
      build:
        files: [
          { src: ['**/*.js', '**/*.png', '**/*.gif', '**/*.woff', 'robots.txt'], cwd: 'app', dest: 'build', expand: true }
        ]
    watch:
      files: ['app/**/*', 'Gruntfile.coffee']
      tasks: ['default']
    mocha:
      test:
        src: ['tests/**/*.html']
        options:
          run: true
    connect:
      server:
        options:
          port: 8000,
          base: 'output'

  grunt.task.registerTask 'code_inliner', 'Inline code from one file into another',  ->
    min_filename = (filename) -> filename.replace(/\.\w+$/,'.min$&')
    debug_filename = (filename) -> filename
    file_variant_funcs = [min_filename, debug_filename]

    inline_file_into_file = (input_filepath, target_filepath, placeholder) ->
      input_content = grunt.file.read(input_filepath, 'utf8')
      input_content_stringified = JSON.stringify(input_content)
      grunt.log.writeln "Inlining '#{input_filepath}' into '#{target_filepath}' where  '#{placeholder}'."
      target_content = grunt.file.read target_filepath, 'utf8'
      target_with_inlined_content = target_content.replace placeholder, input_content_stringified
      grunt.file.write(target_filepath, target_with_inlined_content)


    file_variant_funcs.forEach (file_variant_func) ->
      target_filepath = file_variant_func 'build/js/loader/loader_common.js'

      inline_file_into_file file_variant_func('build/css/basic.css'),
        target_filepath,
          '__INLINE_CSS_PLACEHOLDER__'

      inline_file_into_file file_variant_func('build/css/framed_controls.css'),
        target_filepath, '__INLINE_FRAME_CSS_PLACEHOLDER__'

      inline_file_into_file file_variant_func('build/js/jail_iframe.js'),
        target_filepath, '__INLINE_JS_PLACEHOLDER__'


  grunt.registerTask 'compile', [
    'clean', 'copy:build', 'coffee', 'sass', 'cssUrlEmbed', 'cssmin',
    'concat', 'mocha', 'uglify', 'code_inliner', 'copy:dist']

  grunt.registerTask 'default', ['compile']
  grunt.registerTask 'server', ['compile', 'connect', 'watch']

  grunt.loadNpmTasks 'grunt-contrib-sass'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-cssmin'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-css-url-embed'
  grunt.loadNpmTasks 'grunt-mocha'
