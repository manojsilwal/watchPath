import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { tmdbService } from './services/tmdb.service';

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: '*'
});

const searchSchema = z.object({
  query: z.string().min(1),
  country: z.string().optional()
});

const titleSchema = z.object({
  id: z.string().min(1)
});

const titleQuerySchema = z.object({
  country: z.string().optional()
});

server.get('/api/health', async (request, reply) => {
  return { status: 'ok' };
});

server.get('/api/search', async (request, reply) => {
  const parseResult = searchSchema.safeParse(request.query);
  if (!parseResult.success) {
    reply.status(400).send({ error: 'Invalid query parameters', details: parseResult.error });
    return;
  }
  const { query } = parseResult.data;

  const results = await tmdbService.search(query);
  return { results };
});

server.get('/api/titles/:id', async (request, reply) => {
  const paramsResult = titleSchema.safeParse(request.params);
  if (!paramsResult.success) {
    reply.status(400).send({ error: 'Invalid path parameters', details: paramsResult.error });
    return;
  }

  const queryResult = titleQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    reply.status(400).send({ error: 'Invalid query parameters', details: queryResult.error });
    return;
  }

  const { id } = paramsResult.data;
  const title = await tmdbService.getTitle(id);
  if (!title) {
    reply.status(404).send({ error: 'Title not found' });
    return;
  }

  // Add a mocked best option for demonstration (e.g., Apple TV with a free trial)
  const bestOption = {
    providerName: 'Apple TV+',
    accessType: 'subscription',
    incrementalCost: 9.99,
    currency: 'USD',
    url: 'https://tv.apple.com',
    confidence: 0.95,
    hasFreeTrial: true,
    freeTrialDays: 7
  };

  return { title, bestOption, availability: [], releaseStatus: { status: 'available', officialOttReleaseDate: null, estimatedWindow: null, confidence: 0 }, verificationSummary: { suspiciousLinksFiltered: 0 } };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '9000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
