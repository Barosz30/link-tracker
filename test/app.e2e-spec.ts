import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { LinksController } from '../src/links/links.controller';
import { RedirectController } from '../src/links/redirect.controller';
import { Link } from '../src/links/entities/link.entity';
import { LinksService } from '../src/links/links.service';

describe('Links flow (e2e)', () => {
  let app: INestApplication<App>;
  let links: Link[] = [];
  let nowCounter = 0;

  beforeEach(async () => {
    links = [];
    nowCounter = 0;

    const repositoryMock = {
      create: jest.fn((payload: Partial<Link>) => payload as Link),
      save: jest.fn(async (payload: Link) => {
        const exists = links.find((item) => item.slug === payload.slug);
        if (exists) {
          const error = { code: '23505' };
          throw error;
        }
        const entity: Link = {
          id: `id-${links.length + 1}`,
          slug: payload.slug!,
          targetUrl: payload.targetUrl!,
          clickCount: 0,
          lastAccessedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        links.push(entity);
        return entity;
      }),
      find: jest.fn(async () => [...links].reverse()),
      findOne: jest.fn(async ({ where }: { where: { slug: string } }) => {
        return links.find((item) => item.slug === where.slug) ?? null;
      }),
      delete: jest.fn(async ({ slug }: { slug: string }) => {
        const before = links.length;
        links = links.filter((item) => item.slug !== slug);
        return { affected: before - links.length };
      }),
      createQueryBuilder: jest.fn(() => {
        const state = { slug: '' };
        const queryBuilder = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn((_: string, params: { slug: string }) => {
            state.slug = params.slug;
            return queryBuilder;
          }),
          returning: jest.fn().mockReturnThis(),
          execute: jest.fn(async () => {
            const link = links.find((item) => item.slug === state.slug);
            if (!link) {
              return { raw: [] };
            }
            link.clickCount += 1;
            link.lastAccessedAt = new Date(2026, 0, 1, 0, 0, nowCounter++);
            return { raw: [link] };
          }),
        };
        return queryBuilder;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LinksController, RedirectController],
      providers: [
        LinksService,
        {
          provide: getRepositoryToken(Link),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /links creates a new link', async () => {
    const response = await request(app.getHttpServer())
      .post('/links')
      .send({ slug: 'my-project', targetUrl: 'https://example.com/project' })
      .expect(201);

    expect(response.body.slug).toBe('my-project');
    expect(response.body.clickCount).toBe(0);
  });

  it('GET /r/:slug redirects and increments stats', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({ slug: 'project', targetUrl: 'https://example.com/project' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/r/project')
      .expect(302)
      .expect('Location', 'https://example.com/project');

    const statsResponse = await request(app.getHttpServer())
      .get('/links/project/stats')
      .expect(200);

    expect(statsResponse.body.clickCount).toBe(1);
    expect(statsResponse.body.lastAccessedAt).toBeTruthy();
  });

  it('GET /links/:slug/stats returns 404 for missing slug', async () => {
    await request(app.getHttpServer()).get('/links/missing/stats').expect(404);
  });
});
