import { Router, IRouter } from 'express';
import placesRouter from './places';
import askRouter from './ask';
import authRouter from './auth';
import subscriptionsRouter from './subscriptions';

const router: IRouter = Router();

router.use('/places', placesRouter);
router.use('/ask', askRouter);
router.use('/auth', authRouter);
router.use('/subscriptions', subscriptionsRouter);

export default router;
