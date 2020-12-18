import { cac } from 'cac'
import chalk from 'chalk'
import { build, BuildOptions } from './build'
import { startServer, ServerOptions } from './server'

const cli = cac('vite')

// global options
interface GlobalCLIOptions {
  '--'?: string[]
  debug?: boolean | string
  filter?: string
  d?: boolean | string
  config?: string
  c?: boolean | string
  root?: string
  mode?: string
}

/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions(options: GlobalCLIOptions) {
  const ret = { ...options }
  delete ret['--']
  delete ret.debug
  delete ret.d
  delete ret.filter
  delete ret.config
  delete ret.c
  delete ret.root
  delete ret.mode
  return ret
}

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('--root <path>', `[string] use specified config file`)
  .option('--debug [feat]', `[string | boolean] show debug logs`)
  .option('--filter [filter]', `[string] filter debug logs`)

// dev
cli
  .command('[root]') // default command
  .alias('serve')
  .option('--host <host>', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean] use TLS + HTTP/2`)
  .option('--open', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--mode <mode>', `[string] set env mode`, {
    default: 'development'
  })
  .action((root: string, options: ServerOptions & GlobalCLIOptions) => {
    // output structure is preserved even after bundling so require()
    // is ok here
    const start = require('./server').startServer as typeof startServer
    start(
      {
        root,
        server: cleanOptions(options) as ServerOptions
      },
      options.mode,
      options.config
    ).catch((e) => {
      console.log(chalk.red('[vite] failed to start dev server'))
      console.error(e.stack)
      process.exit(1)
    })
  })

// build
cli
  .command('build [root]')
  .option(
    '--entry <file>',
    `[string]  entry file for build (default: index.html)`
  )
  .option('--base <path>', `[string]  public base path (default: /)`)
  .option('--outDir <dir>', `[string]  output directory (default: dist)`)
  .option(
    '--assetsDir <dir>',
    `[string]  directory under outDir to place assets in (default: _assets)`
  )
  .option(
    '--assetsInlineLimit <number>',
    `[number]  static asset base64 inline threshold in bytes (default: 4096)`
  )
  .option('--ssr', `[boolean]  build for server-side rendering`)
  .option(
    '--sourcemap',
    `[boolean]  output source maps for build (default: false)`
  )
  .option(
    '--minify [minifier]',
    `[boolean | 'terser' | 'esbuild']  enable/disable minification, or specify minifier to use (default: terser)`
  )
  .option('--mode <mode>', `[string]  set env mode`, {
    default: 'production'
  })
  .action((root: string, options: BuildOptions & GlobalCLIOptions) => {
    const runBuild = require('./build').build as typeof build
    runBuild(
      {
        root,
        build: cleanOptions(options) as BuildOptions
      },
      options.mode,
      options.config
    ).catch((e) => {
      console.log(chalk.red('[vite] build failed.'))
      console.error(e.stack)
      process.exit(1)
    })
  })

cli.help()
cli.version(require('../../package.json').version)

cli.parse()