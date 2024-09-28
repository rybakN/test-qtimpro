import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { UsersService } from '../../users/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { Repository } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { GetArticlesQueryDto } from '../dto/get-articles.query.dto';
import { TimespanEnum } from '../types/timespan.enum';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let usersService: Partial<UsersService>;
  let articleRepository: Partial<Repository<Article>>;
  let cacheManager: Partial<Cache>;

  beforeEach(async () => {
    usersService = {
      findOneById: jest.fn(),
    };

    articleRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: UsersService, useValue: usersService },
        { provide: getRepositoryToken(Article), useValue: articleRepository },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  describe('create', () => {
    const userId = 1;
    const createArticleDto: CreateArticleDto = {
      title: 'Test Article',
      description: 'This is a test article.',
    };

    it('should create an article with correct data', async () => {
      const user = { id: userId, username: 'testuser' };
      (usersService.findOneById as jest.Mock).mockResolvedValue(user);
      (articleRepository.create as jest.Mock).mockReturnValue({
        ...createArticleDto,
        author: user,
      });
      (articleRepository.save as jest.Mock).mockResolvedValue({
        id: 1,
        ...createArticleDto,
        author: user,
      });

      const result = await service.create(userId, createArticleDto);

      expect(usersService.findOneById).toHaveBeenCalledWith(userId);
      expect(articleRepository.create).toHaveBeenCalledWith({
        ...createArticleDto,
        author: user,
      });
      expect(articleRepository.save).toHaveBeenCalled();
      expect(cacheManager.reset).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        ...createArticleDto,
        author: user,
      });
    });

    it('should throw ForbiddenException if user is not found', async () => {
      (usersService.findOneById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(userId, createArticleDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(cacheManager.reset).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    const query: GetArticlesQueryDto = {
      author: 'testuser',
      limit: 10,
      page: 1,
      timespan: TimespanEnum.DAY,
    };

    it('should return articles from cache if available', async () => {
      const cachedArticles = [{ id: 1, title: 'Cached Article' }];
      const cacheKey = `articles:${JSON.stringify(query)}`;

      (cacheManager.get as jest.Mock).mockResolvedValue(cachedArticles);

      const result = await service.list(query);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedArticles);
      expect(articleRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch articles from database and cache them if not in cache', async () => {
      const articles = [{ id: 1, title: 'DB Article' }];
      const cacheKey = `articles:${JSON.stringify(query)}`;

      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (articleRepository.find as jest.Mock).mockResolvedValue(articles);
      jest
        .spyOn<any, any>(service, 'calculateDateRange')
        .mockReturnValue([new Date(), new Date()]);
      jest
        .spyOn<any, any>(service, 'createFindManyOptions')
        .mockReturnValue({});

      const result = await service.list(query);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(articleRepository.find).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, articles);
      expect(result).toEqual(articles);
    });
  });

  describe('update', () => {
    const articleId = 1;
    const userId = 1;
    const updateArticleDto: UpdateArticleDto = {
      title: 'Updated Title',
      description: 'Updated content.',
    };

    it('should update the article with correct data', async () => {
      const article = {
        id: articleId,
        author: { id: userId, username: 'testuser' },
      };

      (articleRepository.findOne as jest.Mock).mockResolvedValue(article);
      (articleRepository.merge as jest.Mock).mockReturnValue({
        ...article,
        ...updateArticleDto,
      });
      (articleRepository.save as jest.Mock).mockResolvedValue({
        ...article,
        ...updateArticleDto,
      });

      const result = await service.update(articleId, updateArticleDto, userId);

      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: articleId },
        relations: ['author'],
        select: { author: { id: true, username: true } },
      });
      expect(articleRepository.merge).toHaveBeenCalledWith(
        article,
        updateArticleDto,
      );
      expect(articleRepository.save).toHaveBeenCalled();
      expect(cacheManager.reset).toHaveBeenCalled();
      expect(result).toEqual({
        ...article,
        ...updateArticleDto,
      });
    });

    it('should throw NotFoundException if article is not found', async () => {
      (articleRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(articleId, updateArticleDto, userId),
      ).rejects.toThrow(NotFoundException);
      expect(cacheManager.reset).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const article = {
        id: articleId,
        author: { id: 2, username: 'otheruser' },
      };

      (articleRepository.findOne as jest.Mock).mockResolvedValue(article);

      await expect(
        service.update(articleId, updateArticleDto, userId),
      ).rejects.toThrow(ForbiddenException);
      expect(cacheManager.reset).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const articleId = 1;
    const userId = 1;

    it('should remove the article with correct data', async () => {
      const article = {
        id: articleId,
        author: { id: userId, username: 'testuser' },
      };

      (articleRepository.findOneBy as jest.Mock).mockResolvedValue(article);
      (articleRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.remove(articleId, userId);

      expect(articleRepository.findOneBy).toHaveBeenCalledWith({
        id: articleId,
      });
      expect(articleRepository.delete).toHaveBeenCalledWith(articleId);
      expect(cacheManager.reset).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article is not found', async () => {
      (articleRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(articleId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(cacheManager.reset).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const article = {
        id: articleId,
        author: { id: 2, username: 'otheruser' },
      };

      (articleRepository.findOneBy as jest.Mock).mockResolvedValue(article);

      await expect(service.remove(articleId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(cacheManager.reset).not.toHaveBeenCalled();
    });
  });
});
