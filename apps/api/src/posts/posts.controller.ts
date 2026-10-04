import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CreatePostRequestSchema,
  CreateCommentRequestSchema,
  PostFeedQuerySchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreatePostRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.createPost(userId, parse.data);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async likePost(@Param('id') postId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.likePost(userId, postId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlikePost(@Param('id') postId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.unlikePost(userId, postId);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async bookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.bookmarkPost(userId, postId);
  }

  @Delete(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unbookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.unbookmarkPost(userId, postId);
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string, @Query('limit') limit?: number) {
    return this.postsService.getComments(postId, limit ? Number(limit) : 50);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') postId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreateCommentRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.createComment(userId, postId, parse.data);
  }
}

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getFeed(
    @Query() query: any,
    @Req() req: Request,
  ) {
    const parse = PostFeedQuerySchema.safeParse(query);
    const filter = parse.success ? parse.data.filter : 'all';
    const limit = parse.success ? parse.data.limit : 20;
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.postsService.getFeed(userId, filter, limit);
  }
}

@Controller('creators/:handle/posts')
export class CreatorPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getCreatorPosts(
    @Param('handle') handle: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Req() req?: Request,
  ) {
    const viewerUserId = (req as any)?.user?.userId || (req as any)?.user?.id || undefined;
    return this.postsService.getCreatorPosts(
      handle,
      viewerUserId,
      limit ? Number(limit) : 20,
      cursor,
    );
  }
}
