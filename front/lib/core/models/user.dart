class AppUser {
  final String id;
  final String email;
  final String? name;
  final String? avatarUrl;
  final bool isAdmin;

  const AppUser({
    required this.id,
    required this.email,
    this.name,
    this.avatarUrl,
    this.isAdmin = false,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
    );
  }
}
