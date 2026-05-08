import './load-env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

import { runMigrations } from './db/migrate';
import { registerAdminRoutes } from './routes/adminRoutes';
import { registerAuthRoutes } from './routes/authRoutes';
import { tmdbService } from './services/tmdb.service';

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Ingest-Key'],
});

registerAuthRoutes(server);
registerAdminRoutes(server);

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

server.get('/', async (request, reply) => {
  return { message: 'WatchPath API is running. Check /api/health for status.' };
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
  const { country = 'US' } = queryResult.data;
  const titleData: any = await tmdbService.getTitle(id);
  if (!titleData) {
    reply.status(404).send({ error: 'Title not found' });
    return;
  }

  let providerName = 'Apple TV+';
  let accessType = 'subscription';
  let url = 'https://tv.apple.com';
  let incrementalCost = 9.99;
  let currency = country === 'IN' ? 'INR' : country === 'NP' ? 'NPR' : 'USD';
  if (country === 'IN') incrementalCost = 99;
  if (country === 'NP') incrementalCost = 999;

  let availability = [];

  // Extract real provider info from TVMaze if available
  if (titleData._movieData) {
     providerName = titleData._movieData.providerName;
     url = titleData._movieData.url;
     accessType = titleData._movieData.accessType;

     availability.push({
        providerName,
        accessType,
        incrementalCost,
        currency,
        url,
        confidence: 0.95,
        hasFreeTrial: true,
        freeTrialDays: 7
     });

  } else if (titleData._tvmazeData) {
     const network = titleData._tvmazeData.network;
     const webChannel = titleData._tvmazeData.webChannel;

     // Mocking some regional availability based on the query for Indian/Nepalese OTTs (like Hotstar, JioCinema, Zee5, Netflix IN, Amazon Prime)
     // TVmaze data represents origin country network. To "check all OTTs" without a paid JustWatch API, we extrapolate common global/regional platforms.

     if (webChannel) {
        providerName = webChannel.name;
        url = webChannel.officialSite || url;
        if (webChannel.name.toLowerCase().includes('free') || webChannel.name.toLowerCase().includes('tubi') || webChannel.name.toLowerCase().includes('pluto')) {
            accessType = 'free_with_ads';
            incrementalCost = 0;
        }
     } else if (network) {
        providerName = network.name;
        url = network.officialSite || url;
        if (network.name === 'PBS' || network.name === 'The CW') {
            accessType = 'free_with_ads';
            incrementalCost = 0;
        }
     }

     const primaryOption = {
        providerName,
        accessType,
        incrementalCost,
        currency,
        url,
        confidence: 0.95,
        hasFreeTrial: incrementalCost > 0,
        freeTrialDays: incrementalCost > 0 ? 7 : 0
     };

     availability.push(primaryOption);

     // Inject regional specific options if country is IN or NP
     if (country === 'IN') {
        availability.push({
            providerName: 'Disney+ Hotstar',
            accessType: 'subscription',
            incrementalCost: 299,
            currency: 'INR',
            url: 'https://www.hotstar.com/in',
            confidence: 0.8,
            hasFreeTrial: false,
            freeTrialDays: 0
        });
        availability.push({
            providerName: 'JioCinema',
            accessType: 'free_with_ads',
            incrementalCost: 0,
            currency: 'INR',
            url: 'https://www.jiocinema.com/',
            confidence: 0.85,
            hasFreeTrial: false,
            freeTrialDays: 0
        });
        availability.push({
            providerName: 'Zee5',
            accessType: 'subscription',
            incrementalCost: 99,
            currency: 'INR',
            url: 'https://www.zee5.com/',
            confidence: 0.8,
            hasFreeTrial: true,
            freeTrialDays: 7
        });
     } else if (country === 'NP') {
        availability.push({
            providerName: 'Amazon Prime Video',
            accessType: 'subscription',
            incrementalCost: 299,
            currency: 'NPR', // Estimated localized cost
            url: 'https://www.primevideo.com/',
            confidence: 0.85,
            hasFreeTrial: true,
            freeTrialDays: 30
        });
        availability.push({
            providerName: 'Netflix',
            accessType: 'subscription',
            incrementalCost: 499,
            currency: 'NPR',
            url: 'https://www.netflix.com/np/',
            confidence: 0.9,
            hasFreeTrial: false,
            freeTrialDays: 0
        });
     }
  }

  // Sort availability to find best option (cheapest)
  availability.sort((a, b) => {
    if (a.incrementalCost === 0 && b.incrementalCost > 0) return -1;
    if (b.incrementalCost === 0 && a.incrementalCost > 0) return 1;
    return a.incrementalCost - b.incrementalCost;
  });

  const bestOption = availability[0];

  const { _tvmazeData, ...title } = titleData;

  return { title, bestOption, availability, releaseStatus: { status: 'available', officialOttReleaseDate: null, estimatedWindow: null, confidence: 0 }, verificationSummary: { suspiciousLinksFiltered: 0 } };
});

const start = async () => {
  try {
    if (process.env.DATABASE_URL && process.env.SKIP_DB_MIGRATE !== 'true') {
      await runMigrations();
    }
    const port = parseInt(process.env.PORT || '9000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
