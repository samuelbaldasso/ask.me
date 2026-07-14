import 'package:flutter/material.dart';

/// Paleta vibrante do Ask.me — violeta como cor de assinatura, com
/// coral/âmbar/verde como accents para categorias e estados.
class AppColors {
  static const primary = Color(0xFF7C3AED); // violeta vibrante
  static const primaryDark = Color(0xFF5B21B6);
  static const secondary = Color(0xFFFF6B6B); // coral
  static const tertiary = Color(0xFFFFB020); // âmbar
  static const success = Color(0xFF22C55E);
  static const surface = Color(0xFFFBF9FF);
  static const surfaceDim = Color(0xFFF1EBFF);

  static const gradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, Color(0xFFA855F7)],
  );

  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
  );
}

class AppTheme {
  static ThemeData get theme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      secondary: AppColors.secondary,
      tertiary: AppColors.tertiary,
      surface: AppColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.surface,
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        headlineSmall: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
        titleLarge: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.3),
        titleMedium: TextStyle(fontWeight: FontWeight.w700),
        bodyMedium: TextStyle(height: 1.4),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: Colors.white,
          letterSpacing: -0.5,
        ),
        iconTheme: IconThemeData(color: Colors.white),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: EdgeInsets.zero,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceDim,
        selectedColor: AppColors.primary,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF3A2E5C)),
        shape: const StadiumBorder(),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: AppColors.primary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDim,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
      ),
      dividerTheme: const DividerThemeData(space: 1, color: Color(0xFFEDE7FB)),
    );
  }
}

/// Mapeia categorias para ícone + cor, usado em cards, badges e telas de detalhe.
class CategoryStyle {
  final IconData icon;
  final Color color;

  const CategoryStyle(this.icon, this.color);

  static const _map = <String, CategoryStyle>{
    'restaurante': CategoryStyle(Icons.restaurant_rounded, AppColors.secondary),
    'farmacia': CategoryStyle(Icons.local_pharmacy_rounded, Color(0xFF10B981)),
    'pet-shop': CategoryStyle(Icons.pets_rounded, Color(0xFF3B82F6)),
    'mercado': CategoryStyle(Icons.shopping_cart_rounded, AppColors.tertiary),
    'cafe': CategoryStyle(Icons.local_cafe_rounded, Color(0xFF8B5E3C)),
  };

  static CategoryStyle forSlug(String slug) {
    return _map[slug] ?? const CategoryStyle(Icons.place_rounded, AppColors.primary);
  }
}
