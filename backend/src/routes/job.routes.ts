import express from 'express';
import { runJob, getJobStatus } from '../controllers/job.controller';

const router = express.Router();

router.post('/:jobName', runJob);
router.get('/:jobName/status', getJobStatus);

export default router;