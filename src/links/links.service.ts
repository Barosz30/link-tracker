import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkStatsDto } from './dto/link-stats.dto';
import { Link } from './entities/link.entity';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
  ) {}

  async create(createLinkDto: CreateLinkDto): Promise<Link> {
    const slug = createLinkDto.slug ?? this.generateSlug();
    const link = this.linksRepository.create({
      targetUrl: createLinkDto.targetUrl,
      slug,
    });

    try {
      return await this.linksRepository.save(link);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(`Link with slug "${slug}" already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Link[]> {
    return this.linksRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async remove(slug: string): Promise<void> {
    const result = await this.linksRepository.delete({ slug });
    if (result.affected === 0) {
      throw new NotFoundException(`Link with slug "${slug}" not found`);
    }
  }

  async getStats(slug: string): Promise<LinkStatsDto> {
    const link = await this.findBySlug(slug);
    return {
      slug: link.slug,
      clickCount: link.clickCount,
      lastAccessedAt: link.lastAccessedAt,
      createdAt: link.createdAt,
    };
  }

  async resolveAndTrackBySlug(slug: string): Promise<Link> {
    const result = await this.linksRepository
      .createQueryBuilder()
      .update(Link)
      .set({
        clickCount: () => '"clickCount" + 1',
        lastAccessedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('slug = :slug', { slug })
      .returning('*')
      .execute();

    if (result.raw.length === 0) {
      throw new NotFoundException(`Link with slug "${slug}" not found`);
    }

    return this.linksRepository.create(result.raw[0] as Link);
  }

  private async findBySlug(slug: string): Promise<Link> {
    const link = await this.linksRepository.findOne({ where: { slug } });
    if (!link) {
      throw new NotFoundException(`Link with slug "${slug}" not found`);
    }
    return link;
  }

  private generateSlug(): string {
    return randomBytes(4).toString('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
