/// Configuração de ambiente do app.
///
/// Em Android emulator, `10.0.2.2` aponta para o `localhost` da máquina host.
/// Para dispositivo físico, troque pelo IP da máquina rodando o backend.
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  /// OAuth Client ID do tipo "Web application" no Google Cloud Console —
  /// usado como `serverClientId` do google_sign_in para que o idToken tenha
  /// o `audience` esperado pelo backend (deve bater com GOOGLE_CLIENT_ID
  /// no .env do backend). Sem isso, o login com Google falha na verificação.
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '',
  );
}
