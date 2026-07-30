import { Router, IRouter } from 'express';
import placesRouter from './places';
import askRouter from './ask';
import authRouter from './auth';
import subscriptionsRouter from './subscriptions';
import favoritesRouter from './favorites';
import geocodeRouter from './geocode';

const router: IRouter = Router();

router.use('/places', placesRouter);
router.use('/ask', askRouter);
router.use('/auth', authRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/favorites', favoritesRouter);
router.use('/geocode', geocodeRouter);

export default router;
