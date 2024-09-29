import { IsNotEmpty, IsString, Length } from 'class-validator';

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 5;
const DESCRIPTION_MAX_LENGTH = 1000;

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  @Length(TITLE_MIN_LENGTH, TITLE_MAX_LENGTH)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Length(DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH)
  description: string;
}
