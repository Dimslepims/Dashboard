module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    port: 8081,
    proxy: 'http://localhost:8080/',
  }
}
