import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { TimespanEnum } from '../types/timespan.enum';

export class GetArticlesQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsEnum(TimespanEnum)
  timespan?: TimespanEnum;
}
