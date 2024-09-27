import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { Between, Repository } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import { GetArticlesQueryDto } from '../dto/get-articles.query.dto';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { TimespanEnum } from '../types/timespan.enum';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly userService: UsersService,
  ) {}

  async create(
    userId: number,
    createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new ForbiddenException('Not right enough. User not found.');
    }

    const newArticle = this.articleRepository.create({
      ...createArticleDto,
      author: user,
    });

    return this.articleRepository.save(newArticle);
  }

  async list(query: GetArticlesQueryDto): Promise<Article[]> {
    const { limit = 10, page = 1 } = query;
    const dateRange = this.createDateRange(query.timespan);
    const options: FindManyOptions<Article> = {
      where: {
        author: { username: query.author },
        ...(dateRange && { publishedAt: Between(dateRange[0], dateRange[1]) }),
      },
      take: limit,
      skip: limit * (page - 1),
      order: { publishedAt: 'DESC' },
    };
    return this.articleRepository.find(options);
  }

  async show(id: number) {
    return await this.articleRepository.findOneBy({ id });
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleRepository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }

    const updatedArticle = this.articleRepository.merge(
      article,
      updateArticleDto,
    );
    return await this.articleRepository.save(updatedArticle);
  }

  async remove(id: number): Promise<boolean> {
    return Boolean(await this.articleRepository.delete(id));
  }

  private createDateRange(timespan: TimespanEnum): [Date, Date] | undefined {
    const now = new Date();

    switch (timespan) {
      case TimespanEnum.DAY:
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return [dayAgo, now];
      case TimespanEnum.WEEK:
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return [weekAgo, now];
      default:
        return;
    }
  }
}
