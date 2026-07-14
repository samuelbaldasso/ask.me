import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/account/presentation/state/auth_view_model.dart';
import 'features/search/presentation/screens/search_screen.dart';
import 'features/subscription/presentation/screens/subscription_screen.dart';
import 'features/subscription/presentation/state/subscription_view_model.dart';

/// Porta de entrada do app: login com Google e assinatura ativa são
/// obrigatórios antes de qualquer funcionalidade (busca, IA, etc).
class AppGate extends StatefulWidget {
  const AppGate({super.key});

  @override
  State<AppGate> createState() => _AppGateState();
}

class _AppGateState extends State<AppGate> {
  bool _statusRequestedForCurrentSession = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    if (auth.status == AuthStatus.unknown) {
      return const _SplashLoading();
    }

    if (!auth.isAuthenticated) {
      _statusRequestedForCurrentSession = false;
      return const Scaffold(body: LoginPromptView());
    }

    // Assim que o usuário autentica, busca o status da assinatura uma vez
    // por sessão de login (evita refazer a chamada a cada rebuild do gate).
    if (!_statusRequestedForCurrentSession) {
      _statusRequestedForCurrentSession = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<SubscriptionViewModel>().loadStatus();
      });
    }

    final subscriptionVm = context.watch<SubscriptionViewModel>();

    if (subscriptionVm.status == SubscriptionViewStatus.loadingStatus ||
        subscriptionVm.status == SubscriptionViewStatus.idle) {
      return const _SplashLoading();
    }

    if (!subscriptionVm.isActive) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          title: const Text('Ask.me'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Sair',
              onPressed: () => context.read<AuthViewModel>().signOut(),
            ),
          ],
        ),
        body: PaywallView(vm: subscriptionVm),
      );
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
