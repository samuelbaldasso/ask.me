import { Router, IRouter } from 'express';
import placesRouter from './places';

const router: IRouter = Router();

router.use('/places', placesRouter);

export default router;
