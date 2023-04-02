import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from './interfaces/user.interface';
import { s3Bucket as AWSCloud } from 'src/utils/aws_cloud';

const cloud = new AWSCloud();

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async getAll(
    userId: string,
    page: number,
    limit: number,
    search: string,
  ): Promise<User[]> {
    return await this.userModel.find(
      {
        $and: [
          { _id: { $ne: userId } },
          {
            $or: [
              { fullName: { $regex: search, $options: 'i' } },
              { userName: { $regex: search, $options: 'i' } },
            ],
          },
        ],
      },
      { followers: 0, following: 0, password: 0, __v: 0 },
    );
  }

  // Get user details method
  async getUserDetails(query: {
    email?: string;
    userName?: string;
    _id?: string;
  }): Promise<User> {
    return await this.userModel.findOne(query).lean();
  }

  async findUserById(id: string): Promise<any> {
    return await this.userModel.findById(id).lean();
  }

  // Create new user method
  async createUser(userData: User): Promise<User> {
    const user = new this.userModel(userData);
    return await user.save();
  }

  // Add following
  async addFollowing(id: string, followingTo: string): Promise<User> {
    return await this.userModel.findByIdAndUpdate(id, {
      $push: { following: followingTo },
    });
  }

  // Add follower
  async addFollower(id: string, follower: string): Promise<User> {
    return await this.userModel.findByIdAndUpdate(id, {
      $push: { followers: follower },
    });
  }

  // Remove following
  async removeFollowing(id: string, unfollowTo: string): Promise<User> {
    return await this.userModel.findByIdAndUpdate(id, {
      $pull: { following: unfollowTo },
    });
  }

  // Remove follower
  async removeFollower(id: string, unfollower: string): Promise<User> {
    return await this.userModel.findByIdAndUpdate(id, {
      $pull: { followers: unfollower },
    });
  }

  // Update profile image
  async uploadImage(profileImage: any): Promise<{ url: string; key: string }> {
    return await cloud.createObjectInBucket(profileImage);
  }

  // Update user
  async updateUser(userId: string, query: any): Promise<User> {
    return await this.userModel.findByIdAndUpdate(userId, query);
  }

  // Remove profile image
  async deleteProfileImage(profileImage: {
    url: string;
    key: string;
  }): Promise<any> {
    return await cloud.deleteObject(profileImage.key);
  }

  // Get social stats
  async getSocialStats(id: string, type: string) {
    return await this.userModel.aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          let: { id: `$${type}` },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$id'] } } },
            { $project: { password: 0, __v: 0 } },
          ],
          as: 'resultObjects',
        },
      },
      { $unwind: '$resultObjects' },
      {
        $group: {
          _id: '$_id',
          [type]: { $push: '$resultObjects' },
        },
      },
    ]);
  }
}
