import * as mongoose from 'mongoose';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  Get,
  Put,
  Req,
  Post,
  Param,
  Delete,
  UseGuards,
  Controller,
  UploadedFiles,
  HttpException,
  UseInterceptors,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { fileFilter } from '../utils/file_helper';
import { PostI } from './interfaces/post.interface';
import { UsersService } from '../users/users.service';
import { CODE, MESSAGE, VALIDATION } from '../constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  // Create post
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, { fileFilter }))
  async createPost(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Req() req,
  ): Promise<{ code: number; message: string }> {
    try {
      if (!images || images.length === 0) {
        throw new HttpException(VALIDATION.images, CODE.badRequest);
      }

      // Upload images to the cloud
      const result = await this.postsService.uploadFile(images);

      const postData = {
        images: [...result],
        author: req.user._id,
        detail: req.body.detail,
      };

      // Save uploaded images url and key to database
      const post = await this.postsService.createPost(postData);
      if (!post) {
        throw {
          code: CODE.internalServer,
          message: MESSAGE.createPostFailed,
        };
      }

      return {
        code: CODE.created,
        message: MESSAGE.postCreated,
      };
    } catch (err) {
      console.log({ err });
      throw new HttpException(err.message, err.status);
    }
  }

  // Get user and his following user's all posts
  @UseGuards(JwtAuthGuard)
  @Get()
  async posts(@Req() req): Promise<PostI[]> {
    try {
      // Get user's all following
      const users = [...req.user.following, req.user._id];

      // Get user's posts
      return await this.postsService.posts(users, req.user._id);
    } catch (err) {
      console.log({ err });
      throw new HttpException(err.message, err.code);
    }
  }

  // Get post
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async post(@Req() req, @Param('id') id: string): Promise<PostI> {
    const postId = mongoose.Types.ObjectId(id);
    try {
      // Get user's posts
      const posts = await this.postsService.post(postId, req.user._id);
      return posts[0];
    } catch (err) {
      console.log({ err });
      throw new HttpException(err.message, err.code);
    }
  }

  // Delete post
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Req() req, @Param('id') id: string): Promise<PostI> {
    try {
      // Delete post from database
      const post = await this.postsService.deletePost(req.user._id, id);

      // Remove images of post from cloud
      this.postsService.deletePostImages(post?.images);

      return post;
    } catch (err) {
      console.log({ err });
      throw new HttpException(err.message, err.code);
    }
  }

  // Like post
  @UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async likePost(
    @Req() req,
    @Param('id') id: string,
  ): Promise<{ code: number; post: PostI; message: string }> {
    try {
      const post = await this.postsService.likePost(req.user._id, id);

      return {
        post,
        code: 200,
        message: 'Post liked successfully',
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(err.message, err.code);
    }
  }

  // Unlike post
  @UseGuards(JwtAuthGuard)
  @Put(':id/unlike')
  async unlikePost(
    @Req() req,
    @Param('id') id: string,
  ): Promise<{ code: number; post: PostI; message: string }> {
    try {
      const post = await this.postsService.unlikePost(req.user._id, id);

      return {
        post,
        code: 200,
        message: 'Post unliked successfully',
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(err.message, err.code);
    }
  }
}
