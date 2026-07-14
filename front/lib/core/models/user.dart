class AppUser {
  final String id;
  final String email;
  final String? name;
  final String? avatarUrl;

  const AppUser({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
