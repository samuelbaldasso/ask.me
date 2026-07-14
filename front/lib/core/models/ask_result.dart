import 'paginated_result.dart';
import 'place.dart';

class AskResult {
  final String answer;
  final bool usedAi;
  final PaginatedResult<Place> results;

  const AskResult({
    required this.answer,
    required this.usedAi,
    required this.results,
  });

  factory AskResult.fromJson(Map<String, dynamic> json) {
    return AskResult(
      answer: json['answer'] as String,
      usedAi: json['usedAi'] as bool,
      results: PaginatedResult.fromJson(
        json['results'] as Map<String, dynamic>,
        Place.fromJson,
      ),
    );
  }
}
