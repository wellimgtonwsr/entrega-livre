/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.entregalivre.app',
  appName: 'Entrega Livre',
  webDir: 'dist',
  server: {
    // Em desenvolvimento, aponte para o servidor Vite local
    // Comente esta linha para produção (usa arquivos locais do dist/)
    // url: 'http://SEU_IP_LOCAL:5173',
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    // Adicione configurações de plugins Capacitor aqui conforme necessário
    // Ex: SplashScreen, StatusBar, PushNotifications...
  },
}

module.exports = config
