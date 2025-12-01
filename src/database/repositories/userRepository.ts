import { UserModel, IUserDocument } from '../schemas/User.schema';
import { User, UserRole } from '../../models/User';

export class UserRepository {
  async create(email: string, hashedPassword: string, role: UserRole = UserRole.USER): Promise<User> {
    const user = await UserModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    return this.toUserModel(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.toUserModel(user) : null;
  }

  async findById(userId: string): Promise<User | null> {
    const user = await UserModel.findById(userId);
    return user ? this.toUserModel(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(user => this.toUserModel(user));
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async deleteById(userId: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(userId);
    return result !== null;
  }

  private toUserModel(userDoc: IUserDocument | any): User {
    return {
      userId: userDoc._id.toString(),
      email: userDoc.email,
      password: userDoc.password,
      role: userDoc.role,
      createdAt: userDoc.createdAt,
    };
  }
}

export const userRepository = new UserRepository();