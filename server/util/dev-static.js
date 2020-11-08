const axios = require('axios')
const path = require('path')
/* 由于server端的bundle是在webpack.config.server.js启动后才打包生成的
* so需要在该服务中启动webpack，通过读取webpack打包的结果来获取这部分内容
*/
const webpack = require('webpack')
const MemoryFs = require('memory-fs')
const ReactDomServer = require('react-dom/server')
const proxyPlugin = require('http-proxy-middleware')

const serverConfig = require('../../build/webpack.config.server')

const getTemplate = () => {
  return new Promise((resolve, reject) => {
    axios.get('http://localhost:8888/public/index.html')
      .then(res => {
        resolve(res.data)
      }).catch(reject)
  })
}

const Module = module.constructor

const mfs = new MemoryFs()
// 实例化一个webpack，来启动一个compiler
const serverCompiler = webpack(serverConfig)
// 使用memory-fs插件进行内存文件读写，而不是将其在硬盘中进行，便于加快编译速度
serverCompiler.outputFileSystem = mfs
let serverBundle

/**
 * 监听webpack.config.server中配置的entry 下面的所有文件
 * 一旦发生改变就会自动重新编译
 * 再
 * 获取编译后的bundle内容
 * sataus： 为打包过程的提示信息
 */
serverCompiler.watch({}, (err, status) => {
  if (err) throw err
  status = status.toJson()
  status.errors.forEach(err => console.error(err))
  status.warnings.forEach(warn => console.warn(warn))

  // 获取bundle 路径
  const bundlePath = path.join(
    serverConfig.output.path,
    serverConfig.output.filename
  )
  /**
     * fs： 从硬盘读写文件
     * memory-fs： 在内存中操作文件
     *
     * 由于 readFileSync读取的文件是一个字符串
     * 而我们需要的是一个node的模块
     * 这里使用到module 的constructor构造
     * 将字符串编译为一个node module
     * 注意：readFileSync需要指定文件类型（utf-8)
     */
  const bundle = mfs.readFileSync(bundlePath, 'utf-8')
  // 这里使用到module 的constructor构造 创建一个新的 module
  const m = new Module()
  // 使用module 去解析javascript的 string的内容， 生成一个新的模块，供react-dom create使用
  // 一定要指定一个(server-entry.js)名字，否则其编译时不知道改文件存哪了，下次又在哪里取
  m._compile(bundle, 'server-entry.js')

  serverBundle = m.exports.default
})

module.exports = function (app) {
  // 将所需要的静态文件，使用http-proxy-middleware代理的方式指向
  // dev:client 中webpack编译后的public 的静态文件夹下
  // so 注意该这个服务端渲染时，应该先启动 npm run dev:client
  app.use('/public', proxyPlugin.createProxyMiddleware({
    target: 'http://localhost:8888'
  }))
  app.get('*', function (req, res) {
    getTemplate().then(template => {
      const content = ReactDomServer.renderToString(serverBundle)
      res.send(template.replace('<!-- app -->', content))
    }).catch(err => {
      console.error(err)
    })
  })
}
