-- Migration customizada: adiciona coluna PostGIS e índice GIST
-- Execute após `prisma migrate dev` gerar a migração base.
-- Este arquivo é referenciado nos seeds e testes de integração.

-- Coluna geography para queries ST_DWithin (muito mais eficiente que lat/lng raw)
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Popular `location` a partir de lat/lng
UPDATE places
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  WHERE location IS NULL;

-- Índice GIST para buscas espaciais rápidas
CREATE INDEX IF NOT EXISTS places_location_gist
  ON places USING GIST (location);

-- Trigger: mantém `location` sincronizado quando lat/lng forem atualizados
CREATE OR REPLACE FUNCTION sync_place_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_place_location ON places;
CREATE TRIGGER trg_sync_place_location
  BEFORE INSERT OR UPDATE OF lat, lng ON places
  FOR EACH ROW EXECUTE FUNCTION sync_place_location();
