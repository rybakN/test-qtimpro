import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Length(5, 1000)
  description: string;
}
