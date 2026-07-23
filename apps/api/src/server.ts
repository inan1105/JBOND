import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createPrimaryAdapter } from './adapters/index.js';

const PORT = Number(process.env.API_PORT ?? 4000);
const HOST = process.env.API_HOST ?? '0.0.0.0';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const adapter = createPrimaryAdapter(process.env);

app.get('/health', async () => ({ status: 'ok', source: adapter.source }));

app.get('/api/bonds/search', async (req) => {
  const q = req.query as Record<string, string>;
  return adapter.search({
    keyword: q.keyword,
    issuer: q.issuer,
    category: q.category as never,
    currency: q.currency,
  });
});

app.get('/api/bonds/:bondId', async (req, reply) => {
  const { bondId } = req.params as { bondId: string };
  const detail = await adapter.getDetail(bondId);
  if (!detail) return reply.code(404).send({ error: 'NOT_FOUND', bondId });
  return detail;
});

app.get('/api/bonds/:bondId/observations', async (req) => {
  const { bondId } = req.params as { bondId: string };
  const q = req.query as Record<string, string>;
  return adapter.getObservations(bondId, q.from ?? '2025-01-01', q.to ?? '2026-07-23');
});

app.get('/api/curves/:curveId', async (req) => {
  const { curveId } = req.params as { curveId: string };
  const q = req.query as Record<string, string>;
  return adapter.getCurve(curveId, q.date ?? '2026-07-23');
});

app.get('/api/mtm', async (req) => {
  const q = req.query as Record<string, string>;
  return adapter.getMtmMatrix(q.date ?? '2026-07-23');
});

app
  .listen({ port: PORT, host: HOST })
  .then((addr) => app.log.info(`James Bond API on ${addr} (source=${adapter.source})`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
