class ApiException implements Exception {
  final String message;

  const ApiException(this.message);

  factory ApiException.fromDioError(dynamic error) {
    return const ApiException(
      'Não foi possível carregar os resultados. Verifique sua conexão e tente novamente.',
    );
  }

  @override
  String toString() => message;
}
