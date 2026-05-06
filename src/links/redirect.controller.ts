import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { LinksService } from './links.service';

@Controller('r')
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':slug')
  @Redirect(undefined, 302)
  async redirectToTarget(@Param('slug') slug: string) {
    const link = await this.linksService.resolveAndTrackBySlug(slug);
    return { url: link.targetUrl };
  }
}
