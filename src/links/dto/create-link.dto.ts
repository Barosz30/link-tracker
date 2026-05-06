import { IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateLinkDto {
  @IsUrl()
  targetUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'slug can only contain letters, numbers, dash and underscore',
  })
  slug?: string;
}
