// Mapeia categorias do produto para o `type` aceito pela Google Places Nearby
// Search API. Compartilhado entre o script manual (src/db/discoverPlaces.ts)
// e a descoberta automática sob demanda (src/services/discoveryService.ts).
// https://developers.google.com/maps/documentation/places/web-service/supported_types
export const CATEGORY_TO_GOOGLE_TYPE: Record<string, string> = {
  restaurante: 'restaurant',
  farmacia: 'pharmacy',
  'pet-shop': 'pet_store',
  supermercado: 'supermarket',
};
