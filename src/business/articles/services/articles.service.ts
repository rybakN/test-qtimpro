import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { GetArticlesQueryDto } from '../dto/get-articles.query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { Between, Repository } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { TimespanEnum } from '../types/timespan.enum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ArticlesService {
  /**
   * Constructs a new ArticlesService.
   *
   * @param {Repository<Article>} articleRepository - The repository for article entities.
   * @param {UsersService} userService - The service to manage user entities.
   * @param {Cache} cacheManager - The cache manager to handle caching.
   */
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly userService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Creates a new article.
   *
   * @param {number} userId - The ID of the user creating the article.
   * @param {CreateArticleDto} createArticleDto - The data transfer object containing article creation details.
   * @returns {Promise<Article>} The created article entity.
   * @throws {ForbiddenException} If the user does not have permission to create an article.
   */
  async create(
    userId: number,
    createArticleDto: CreateArticleDto,
  ): Promise<Article> {
    const user = await this.userService.findOneById(userId);
    if (!user)
      throw new ForbiddenException(
        'You do not have permission to create an article.',
      );

    const newArticle = this.articleRepository.create({
      ...createArticleDto,
      author: user,
    });

    const article = await this.articleRepository.save(newArticle);
    await this.cacheManager.reset();
    return article;
  }

  /**
   * Lists articles based on query parameters.
   *
   * @param {GetArticlesQueryDto} query - The query parameters for listing articles.
   * @returns {Promise<Article[]>} The list of articles.
   */
  async list(query: GetArticlesQueryDto): Promise<Article[]> {
    const cacheKey = `articles:${JSON.stringify(query)}`;
    const cachedArticles = await this.cacheManager.get<Article[]>(cacheKey);

    if (cachedArticles) {
      return cachedArticles;
    }

    const dateRange = this.calculateDateRange(query.timespan);
    const options = this.createFindManyOptions(query, dateRange);
    const articles = await this.articleRepository.find(options);

    await this.cacheManager.set(cacheKey, articles);
    return articles;
  }

  /**
   * Updates an article.
   *
   * @param {number} id - The ID of the article to update.
   * @param {UpdateArticleDto} updateArticleDto - The data transfer object containing article update details.
   * @param {number} userId - The ID of the user updating the article.
   * @returns {Promise<Article>} The updated article entity.
   * @throws {NotFoundException} If the article is not found.
   * @throws {ForbiddenException} If the user does not have permission to update the article.
   */
  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    userId: number,
  ): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        author: {
          id: true,
          username: true,
        },
      },
    });
    if (!article) throw new NotFoundException('Article not found.');

    if (article.author.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this article.',
      );
    }

    const mergedArticle = this.articleRepository.merge(
      article,
      updateArticleDto,
    );
    const updatedArticle = await this.articleRepository.save(mergedArticle);
    await this.cacheManager.reset();
    return updatedArticle;
  }

  /**
   * Removes an article.
   *
   * @param {number} id - The ID of the article to remove.
   * @param {number} userId - The ID of the user removing the article.
   * @returns {Promise<void>} A promise that resolves when the article is removed.
   * @throws {NotFoundException} If the article is not found.
   * @throws {ForbiddenException} If the user does not have permission to remove the article.
   */
  async remove(id: number, userId: number): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found.');

    if (article.author.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to remove this article.',
      );
    }

    await this.articleRepository.delete(id);
    await this.cacheManager.reset();
  }

  /**
   * Calculates the date range based on the given timespan.
   *
   * @param {TimespanEnum} timespan - The timespan to calculate the date range for.
   * @returns {[Date, Date]} The calculated date range.
   */
  private calculateDateRange(timespan: TimespanEnum): [Date, Date] {
    const now = new Date();

    switch (timespan) {
      case TimespanEnum.DAY:
        return [new Date(now.getTime() - 24 * 60 * 60 * 1000), now];
      case TimespanEnum.WEEK:
        return [new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now];
      default:
        const exhaustiveCheck: never = timespan;
    }
  }

  /**
   * Creates the options for finding many articles based on the query and date range.
   *
   * @param {GetArticlesQueryDto} query - The query parameters for finding articles.
   * @param {[Date, Date]} dateRange - The date range to filter articles by.
   * @returns {FindManyOptions<Article>} The options for finding many articles.
   */
  private createFindManyOptions(
    query: GetArticlesQueryDto,
    dateRange: [Date, Date],
  ): FindManyOptions<Article> {
    const { limit = 10, page = 1 } = query;
    return {
      where: {
        author: { username: query.author },
        ...(dateRange && { publishedAt: Between(dateRange[0], dateRange[1]) }),
      },
      take: limit,
      skip: limit * (page - 1),
      relations: ['author'],
      select: {
        author: {
          id: true,
          username: true,
        },
      },
    };
  }
}
