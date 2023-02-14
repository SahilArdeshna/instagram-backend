import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UserModule } from './users/users.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({ envFilePath: `${__dirname}/../.env` }),
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      useFindAndModify: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
