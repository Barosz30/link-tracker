import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinkStatsDto } from './dto/link-stats.dto';
import { Link } from './entities/link.entity';
import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() createLinkDto: CreateLinkDto): Promise<Link> {
    return this.linksService.create(createLinkDto);
  }

  @Get()
  findAll(): Promise<Link[]> {
    return this.linksService.findAll();
  }

  @Get(':slug/stats')
  getStats(@Param('slug') slug: string): Promise<LinkStatsDto> {
    return this.linksService.getStats(slug);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('slug') slug: string): Promise<void> {
    await this.linksService.remove(slug);
  }
}
