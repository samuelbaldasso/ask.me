import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/models/user.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/auth_repository.dart';

enum AuthStatus { unknown, unauthenticated, authenticating, authenticated }

const _tokenStorageKey = 'askme_jwt';

/// Login é opcional no MVP — a busca funciona sem conta. Este estado só é
/// consultado quando o usuário tenta acessar uma feature que exige login
/// (hoje: assinatura).
class AuthViewModel extends ChangeNotifier {
  final AuthRepository _authRepository;
  final ApiClient _apiClient;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId:
        AppConfig.googleServerClientId.isEmpty ? null : AppConfig.googleServerClientId,
  );
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  AuthStatus status = AuthStatus.unknown;
  AppUser? user;
  String? errorMessage;

  AuthViewModel(this._authRepository, this._apiClient);

  bool get isAuthenticated => status == AuthStatus.authenticated;

  /// Restaura a sessão a partir do JWT salvo, se houver. Não valida o token
  /// contra o backend aqui — se estiver expirado, a primeira chamada
  /// autenticada retorna 401 e a UI trata como deslogado.
  Future<void> restoreSession() async {
    final storedToken = await _secureStorage.read(key: _tokenStorageKey);

    if (storedToken == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    _apiClient.authToken = storedToken;

    try {
      user = await _authRepository.fetchCurrentUser();
      status = AuthStatus.authenticated;
    } on ApiException {
      // Token salvo é inválido/expirado — trata como deslogado.
      await _secureStorage.delete(key: _tokenStorageKey);
      _apiClient.authToken = null;
      user = null;
      status = AuthStatus.unauthenticated;
    } catch (e, stack) {
      debugPrint('[AuthViewModel] restoreSession failed: $e\n$stack');
      _apiClient.authToken = null;
      user = null;
      status = AuthStatus.unauthenticated;
    }

    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    status = AuthStatus.authenticating;
    errorMessage = null;
    notifyListeners();

    try {
      final googleAccount = await _googleSignIn.signIn();

      if (googleAccount == null) {
        // Usuário cancelou o fluxo de login.
        status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }

      final googleAuth = await googleAccount.authentication;
      final idToken = googleAuth.idToken;

      if (idToken == null) {
        throw const ApiException('Não foi possível obter o token do Google.');
      }

      final result = await _authRepository.loginWithGoogle(idToken);

      await _secureStorage.write(key: _tokenStorageKey, value: result.token);
      _apiClient.authToken = result.token;
      user = result.user;
      status = AuthStatus.authenticated;
    } on ApiException catch (e) {
      errorMessage = e.message;
      status = AuthStatus.unauthenticated;
    } catch (e, stack) {
      debugPrint('[AuthViewModel] signInWithGoogle failed: $e\n$stack');
      errorMessage = 'Não foi possível entrar com o Google. Tente novamente.';
      status = AuthStatus.unauthenticated;
    } finally {
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _secureStorage.delete(key: _tokenStorageKey);
    await _googleSignIn.signOut();
    _apiClient.authToken = null;
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
