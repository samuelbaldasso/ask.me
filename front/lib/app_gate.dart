import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/account/presentation/state/auth_view_model.dart';
import 'features/search/presentation/screens/search_screen.dart';

/// Porta de entrada do app. Login e assinatura são opcionais para navegar e
/// buscar (Fase 1/2) — só são exigidos sob demanda pelas features que
/// dependem deles (IA e favoritos exigem login; IA também exige assinatura
/// ativa). Isso evita bloquear a pré-visualização do app antes de assinar.
class AppGate extends StatelessWidget {
  const AppGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    if (auth.status == AuthStatus.unknown) {
      return const _SplashLoading();
    }

    return const SearchScreen();
  }
}

class _SplashLoading extends StatelessWidget {
  const _SplashLoading();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );
  }
}
