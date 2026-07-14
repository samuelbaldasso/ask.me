import '../../../../core/models/place.dart';

enum ChatRole { user, assistant }

/// Uma mensagem no histórico de conversa. Mensagens do assistente carregam
/// os `results` estruturados retornados junto com a resposta em texto,
/// para renderizar os cards de estabelecimentos abaixo da resposta.
class ChatMessage {
  final ChatRole role;
  final String text;
  final List<Place> results;
  final bool isLoading;
  final bool isError;

  const ChatMessage({
    required this.role,
    required this.text,
    this.results = const [],
    this.isLoading = false,
    this.isError = false,
  });
}
