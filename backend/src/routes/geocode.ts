import { Router, IRouter } from 'express';
import { geocodeController } from '../controllers/geocodeController';

const router: IRouter = Router();

/**
 * GET /geocode?address=...
 * Público, sem autenticação — mesma política da busca tradicional.
 * Converte um endereço/bairro/cidade em lat/lng, para usuários que não
 * concedem (ou não têm) permissão de geolocalização do navegador.
 */
router.get('/', geocodeController);

export default router;
