/// Configuração de ambiente do app.
///
/// Em Android emulator, `10.0.2.2` aponta para o `localhost` da máquina host.
/// Para dispositivo físico, troque pelo IP da máquina rodando o backend.
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );
}
