class PaginatedResult<T> {
  final List<T> data;
  final int total;
  final int limit;
  final int offset;

  const PaginatedResult({
    required this.data,
    required this.total,
    required this.limit,
    required this.offset,
  });

  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedResult(
      data: (json['data'] as List)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      limit: json['limit'] as int,
      offset: json['offset'] as int,
    );
  }

  bool get hasMore => offset + data.length < total;
}
