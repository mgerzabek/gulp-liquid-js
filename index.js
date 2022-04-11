const Transform = require('stream').Transform
const PluginError = require('plugin-error')
const Liquid = require('liquidjs')
const replaceExtension = require('replace-ext')

const PLUGIN_NAME = 'gulp-liquid-js'

const defaultOptions = {
  engine: {
    extname: '.liquid',
  },
  ext: '.html',
  filters: {},
  tags: {},
  plugins: [],
  data: {},
}

module.exports = (options = {}) => {
  
  options = {
    ...defaultOptions,
    ...options
  }

  return new Transform({
    objectMode: true,
    transform(file, enc, callback) {

      const engine = new Liquid(options.engine)

      for (const filter in options.filters) {
        if (Object.prototype.hasOwnProperty.call(options.filters, filter)) {
          engine.registerFilter(filter, options.filters[filter])
        }
      }

      for (const tag in options.tags) {
        if (Object.prototype.hasOwnProperty.call(options.tags, tag)) {
          engine.registerTag(tag, options.tags[tag])
        }
      }

      if (options.plugins.length) {
        for (const plugin of options.plugins) {
          engine.plugin(plugin)
        }
      }

      if (file.data) {
        options.data = objectAssignDeep(options.data, file.data)
      }

      if (file.isNull()) {
        return callback(null, file)
      }

      if (file.isStream()) {
        return callback(new PluginError(PLUGIN_NAME, 'Streaming is not supported'))
      }

      if (file.isBuffer()) {
        file.path = replaceExtension(file.path, options.ext)

        engine.parseAndRender(file.contents.toString(), options.data)
          .then((output) => {
            file.contents = Buffer.from(output)
            return callback(null, file)
          }, err => callback(new PluginError(PLUGIN_NAME, err)))
      }

      return null
    }
  })
}
