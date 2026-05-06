import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from './entities/link.entity';
import { LinksService } from './links.service';

describe('LinksService', () => {
  let service: LinksService;
  let repository: jest.Mocked<Repository<Link>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: getRepositoryToken(Link),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(LinksService);
    repository = moduleRef.get(getRepositoryToken(Link));
  });

  it('creates a link', async () => {
    const created = {
      slug: 'my-project',
      targetUrl: 'https://example.com',
      clickCount: 0,
      lastAccessedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Link;
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    const result = await service.create({
      slug: 'my-project',
      targetUrl: 'https://example.com',
    });

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalledWith({
      slug: 'my-project',
      targetUrl: 'https://example.com',
    });
  });

  it('throws conflict on duplicate slug', async () => {
    repository.create.mockReturnValue({} as Link);
    repository.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.create({
        slug: 'duplicate',
        targetUrl: 'https://example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('increments click count on redirect', async () => {
    const updated = {
      slug: 'slug',
      targetUrl: 'https://example.com',
      clickCount: 5,
      lastAccessedAt: new Date(),
    } as Link;

    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: [updated] }),
    };

    repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
    repository.create.mockReturnValue(updated);

    const result = await service.resolveAndTrackBySlug('slug');

    expect(result.clickCount).toBe(5);
    expect(queryBuilder.where).toHaveBeenCalledWith('slug = :slug', {
      slug: 'slug',
    });
  });

  it('throws not found when slug missing for stats', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.getStats('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
