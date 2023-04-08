import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { UserSchema } from './Schema/user.schema';
import { PostsModule } from '../posts/posts.module';
import { UsersController } from './users.controller';

@Module({
  imports: [
    AuthModule,
    PostsModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
