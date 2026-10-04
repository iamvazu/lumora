import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PostsService } from './posts.service.js';
import { PostsController, FeedController, CreatorPostsController } from './posts.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [PostsController, FeedController, CreatorPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
