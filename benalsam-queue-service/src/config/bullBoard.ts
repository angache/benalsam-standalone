import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { elasticsearchSyncQueue } from '../queues/elasticsearchSyncQueue';
import logger from '../utils/logger';

// Create Bull Board instance
export const createBullBoardInstance = () => {
  try {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
      queues: [new BullAdapter(elasticsearchSyncQueue)],
      serverAdapter,
    });

    logger.info('✅ Bull Board dashboard created successfully');

    return {
      addQueue,
      removeQueue,
      setQueues,
      replaceQueues,
      router: serverAdapter.getRouter(),
    };
  } catch (error) {
    logger.error('❌ Failed to create Bull Board instance:', error);
    throw error;
  }
};

// Get all queues for Bull Board
export const getBullBoardQueues = () => {
  return [
    new BullAdapter(elasticsearchSyncQueue),
  ];
};
