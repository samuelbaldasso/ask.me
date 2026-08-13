import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../state/auth_view_model.dart';

/// Tela de login independente, usada quando qualquer feature exige apenas
/// estar logado (busca por IA, favoritos, painel do lojista). Login é
/// gratuito — a única cobrança do app é o plano B2B do lojista.
/// Fecha sozinha assim que o login é concluído.
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthViewModel>(
      builder: (context, auth, _) {
        if (auth.isAuthenticated) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (Navigator.of(context).canPop()) Navigator.of(context).pop();
          });
        }

        return Scaffold(
          appBar: AppBar(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            title: const Text('Entrar'),
          ),
          body: const LoginPromptView(),
        );
      },
    );
  }
}

class LoginPromptView extends StatelessWidget {
  const LoginPromptView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.person_rounded, size: 56, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'Entre com sua conta Google para usar o Ask.me.',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 24),
            if (auth.errorMessage != null) ...[
              Text(
                auth.errorMessage!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: auth.status == AuthStatus.authenticating
                  ? null
                  : () => context.read<AuthViewModel>().signInWithGoogle(),
              icon: auth.status == AuthStatus.authenticating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.login_rounded),
              label: const Text('Entrar com Google'),
            ),
          ],
        ),
      ),
    );
  }
}
