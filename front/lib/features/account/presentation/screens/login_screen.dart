import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../subscription/presentation/screens/subscription_screen.dart';
import '../state/auth_view_model.dart';

/// Tela de login independente, usada quando uma feature gratuita (ex:
/// favoritar) exige apenas estar logado — sem empurrar o usuário pro
/// paywall, ao contrário do fluxo de assinatura (ver SubscriptionScreen).
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
