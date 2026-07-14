import 'package:flutter/foundation.dart';

import '../../../../core/services/location_service.dart';
import '../../data/ask_repository.dart';
import 'chat_message.dart';

/// ViewModel da tela de busca conversacional (Fase 4) — mantém o histórico
/// do chat e delega a busca em linguagem natural para o AskRepository,
/// seguindo o mesmo padrão MVVM da SearchViewModel.
class AiSearchViewModel extends ChangeNotifier {
  final AskRepository _repository;
  final LocationService _locationService;

  AiSearchViewModel(this._repository, this._locationService);

  final List<ChatMessage> messages = [];
  bool isSending = false;

  Future<void> sendQuery(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty || isSending) return;

    messages.add(ChatMessage(role: ChatRole.user, text: trimmed));
    // Mensagem "digitando..." — simula o feedback de streaming enquanto o
    // backend (request/response único, sem SSE) processa a busca.
    messages.add(const ChatMessage(role: ChatRole.assistant, text: '', isLoading: true));
    isSending = true;
    notifyListeners();

    try {
      final position = await _locationService.getCurrentPosition();
      final result = await _repository.ask(
        query: trimmed,
        lat: position.latitude,
        lng: position.longitude,
      );

      messages.removeLast();
      messages.add(
        ChatMessage(
          role: ChatRole.assistant,
          text: result.answer,
          results: result.results.data,
        ),
      );
    } on LocationServiceException catch (e) {
      messages.removeLast();
      messages.add(ChatMessage(role: ChatRole.assistant, text: e.message, isError: true));
    } catch (e) {
      messages.removeLast();
      messages.add(
        ChatMessage(
          role: ChatRole.assistant,
          text: 'Não foi possível buscar agora. Verifique sua conexão e tente novamente.',
          isError: true,
        ),
      );
    }

    isSending = false;
    notifyListeners();
  }
}
