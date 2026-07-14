import 'package:flutter/material.dart';

import '../../../../core/models/place.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../place_detail/presentation/screens/place_detail_screen.dart';
import '../../../search/presentation/widgets/place_card.dart';
import '../state/chat_message.dart';
import 'typing_indicator.dart';

class ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == ChatRole.user;

    return Column(
      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Align(
          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: isUser && !message.isError ? AppColors.gradient : null,
              color: isUser ? null : _bubbleColor(context, message.isError),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isUser ? 18 : 4),
                bottomRight: Radius.circular(isUser ? 4 : 18),
              ),
            ),
            child: message.isLoading
                ? const TypingIndicator()
                : Text(
                    message.text,
                    style: TextStyle(
                      color: isUser ? Colors.white : Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
          ),
        ),
        if (message.results.isNotEmpty) _ResultsCarousel(results: message.results),
      ],
    );
  }

  Color _bubbleColor(BuildContext context, bool isError) {
    if (isError) return Theme.of(context).colorScheme.errorContainer;
    return AppColors.surfaceDim;
  }
}

class _ResultsCarousel extends StatelessWidget {
  final List<Place> results;

  const _ResultsCarousel({required this.results});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        itemCount: results.length,
        itemBuilder: (context, index) {
          final place = results[index];
          return SizedBox(
            width: 260,
            child: PlaceCard(
              place: place,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => PlaceDetailScreen(place: place)),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
