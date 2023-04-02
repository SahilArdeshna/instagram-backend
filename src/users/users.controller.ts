import {
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './interfaces/user.interface';
import { UsersService } from './users.service';
import { imageProfileFilter } from 'src/utils/file_helper';
import { CODE, MESSAGE } from 'src/constants';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PostsService } from 'src/posts/posts.service';
import { PostI } from 'src/posts/interfaces/post.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  // Get users
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Req() req): Promise<User[]> {
    try {
      const userId = req.user._id;
      const page = req.query.page;
      const limit = req.query.limit;
      const search = req.query.search;

      return this.usersService.getAll(userId, page, limit, search);
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Follow user
  @UseGuards(JwtAuthGuard)
  @Get(':id/follow')
  async followUser(
    @Req() req,
    @Param('id') id: string,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      const user = req.user._id;
      const followToUserId = id;

      // Add followToUser into User's following array
      const result = await this.usersService.addFollowing(user, followToUserId);
      if (!result) {
        throw {
          code: CODE.internalServer,
          message: MESSAGE.addFollowingError,
        };
      }

      // Add User into FollowingToUser's follower array
      await this.usersService.addFollower(followToUserId, user);

      return {
        statusCode: CODE.success,
        message: MESSAGE.followed,
      };
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Unfollow user
  @UseGuards(JwtAuthGuard)
  @Get(':id/unfollow')
  async unfollowUser(
    @Req() req,
    @Param('id') id: string,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      const user = req.user._id;
      const unfollowUserId = id;

      // Add followToUser into User's following array
      const result = await this.usersService.removeFollowing(
        user,
        unfollowUserId,
      );
      if (!result) {
        throw {
          code: CODE.internalServer,
          message: MESSAGE.removeFollowingError,
        };
      }

      // Add User into FollowingToUser's follower array
      await this.usersService.removeFollower(unfollowUserId, user);

      return {
        statusCode: CODE.success,
        message: MESSAGE.unfollowed,
      };
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Uplaod profile image
  @UseGuards(JwtAuthGuard)
  @Post('uploadImage')
  @UseInterceptors(
    FileInterceptor('profileImage', { fileFilter: imageProfileFilter }),
  )
  async uploadImage(
    @UploadedFile() profileImage: Express.Multer.File,
    @Req() req,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      // User Id
      const userId = req.user._id;

      // Upload profile image to cloud
      const image = await this.usersService.uploadImage(profileImage);
      if (!image) {
        throw {
          code: CODE.internalServer,
          message: MESSAGE.profileImageError,
        };
      }

      const updateData = {
        profileImage: { ...image },
      };

      // Update image data into database
      await this.usersService.updateUser(userId, updateData);

      return {
        statusCode: CODE.success,
        message: MESSAGE.profileImage,
      };
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Delete profile image
  @UseGuards(JwtAuthGuard)
  @Post('deleteImage')
  async deleteImage(
    @Req() req,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      const userId = req.user._id;
      const updateData = {
        $unset: {
          profileImage: 1,
        },
      };

      // Remove profile image data from database
      const user = await this.usersService.updateUser(userId, updateData);
      if (!user) {
        throw {
          code: CODE.internalServer,
          message: MESSAGE.removeProfileImageError,
        };
      }

      // Profile image from cloud
      this.usersService.deleteProfileImage(user.profileImage);

      return {
        statusCode: CODE.success,
        message: MESSAGE.profileImageRemoved,
      };
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Get oauth user
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req): Promise<User> {
    try {
      const user = await this.usersService.findUserById(req.user._id);

      if (!user) {
        throw {
          code: CODE.badRequest,
          message: MESSAGE.userNotFound,
        };
      }

      // Remove unnecessary data
      delete user.__v;
      delete user.password;

      return user;
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Get user by userName
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async user(@Param('id') id: string): Promise<User> {
    try {
      // Fetch user
      const user = await this.usersService.getUserDetails({ _id: id });

      if (!user) {
        throw {
          code: CODE.badRequest,
          message: MESSAGE.userNotFound,
        };
      }

      // Remove unnecessary data
      delete user.__v;
      delete user.password;

      return user;
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Get posts of user
  @UseGuards(JwtAuthGuard)
  @Get(':userName/posts')
  async posts(
    @Param('userName') userName: string,
  ): Promise<{ user: User; posts: PostI[] }> {
    try {
      // Fetch user
      const user = await this.usersService.getUserDetails({ userName });

      if (!user) {
        throw {
          code: CODE.badRequest,
          message: MESSAGE.userNotFound,
        };
      }

      // Fetch posts by author id
      const posts = await this.postsService.postsByAuthor(user._id);

      // Remove unnecessary data
      delete user.__v;
      delete user.password;
      delete user.email;
      delete user.updatedAt;

      return {
        user,
        posts,
      };
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }

  // Get social stats
  @UseGuards(JwtAuthGuard)
  @Get(':id/social-stats')
  async socialStats(@Param('id') id: string, @Req() req): Promise<User[]> {
    try {
      const type = req.query.type;

      // Fetch user
      const user = await this.usersService.getSocialStats(id, type);

      if (!user) {
        throw {
          code: CODE.badRequest,
          message: MESSAGE.userNotFound,
        };
      }

      return user;
    } catch (err) {
      throw new HttpException(err.message, err.code);
    }
  }
}
