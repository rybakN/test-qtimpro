import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ArticlesService } from '../services/articles.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { JwtAuth } from '../../auth/decorators/jwt-guard.decorator';
import { UserId } from '../../../core/decorators/userId.decorator';
import { Article } from '../entities/article.entity';
import { GetArticlesQueryDto } from '../dto/get-articles.query.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @JwtAuth()
  @Post()
  async create(
    @UserId() userId: number,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    return this.articlesService.create(userId, createArticleDto);
  }

  @Get()
  async list(@Query() query: GetArticlesQueryDto): Promise<Article[]> {
    return this.articlesService.list(query);
  }

  @JwtAuth()
  @Patch(':id')
  async update(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    return this.articlesService.update(id, updateArticleDto, userId);
  }

  @JwtAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ): Promise<void> {
    return this.articlesService.remove(id, userId);
  }
}
