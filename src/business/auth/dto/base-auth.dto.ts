import { IsNotEmpty, IsString, Length } from 'class-validator';

export class BaseAuthDto {
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 30)
  password: string;
}
