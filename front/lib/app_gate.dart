import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/account/presentation/state/auth_view_model.dart';
import 'features/search/presentation/screens/search_screen.dart';

/// Porta de entrada do app. Login é opcional para navegar e buscar — só é
/// exigido sob demanda pelas features que dependem dele (busca por IA e
/// favoritos exigem login; não há paywall no lado consumidor, a única
/// assinatura paga do app é o plano B2B do lojista).
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
