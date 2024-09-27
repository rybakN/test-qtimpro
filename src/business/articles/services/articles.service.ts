import {
  ForbiddenException,
  Inject,
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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly userService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    const article = await this.articleRepository.save(newArticle);
    await this.cacheManager.reset();

    return article;
  }

  async list(query: GetArticlesQueryDto): Promise<Article[]> {
    const cacheKey = `articles:${JSON.stringify(query)}`;
    const cachedArticles = await this.cacheManager.get<Article[]>(cacheKey);

    if (cachedArticles) {
      return cachedArticles;
    }

    const { limit = 10, page = 1 } = query;
    const dateRange = this.createDateRange(query.timespan);
    const options: FindManyOptions<Article> = {
      where: {
        author: { username: query.author },
        ...(dateRange && { publishedAt: Between(dateRange[0], dateRange[1]) }),
      },
      take: limit,
      skip: limit * (page - 1),
    };

    const articles = await this.articleRepository.find(options);
    await this.cacheManager.set(cacheKey, articles);

    return articles;
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
    const savedArticle = await this.articleRepository.save(updatedArticle);
    await this.cacheManager.reset();

    return savedArticle;
  }

  async remove(id: number): Promise<void> {
    await this.articleRepository.delete(id);
    await this.cacheManager.reset();
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
