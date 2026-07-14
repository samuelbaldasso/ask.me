import { Router, IRouter } from 'express';
import placesRouter from './places';
import askRouter from './ask';

const router: IRouter = Router();

router.use('/places', placesRouter);
router.use('/ask', askRouter);

export default router;
