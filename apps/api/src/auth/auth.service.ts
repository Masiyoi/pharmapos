import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create pharmacy + main branch + admin user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create pharmacy
      const pharmacy = await tx.pharmacy.create({
        data: {
          name: dto.pharmacyName,
          licenseNo: dto.pharmacyLicenseNo,
          phone: dto.pharmacyPhone,
          address: dto.pharmacyAddress,
          county: dto.pharmacyCounty,
        },
      });

      // 2. Create main branch
      const branch = await tx.branch.create({
        data: {
          pharmacyId: pharmacy.id,
          name: `${dto.pharmacyName} - Main`,
          address: dto.pharmacyAddress,
          phone: dto.pharmacyPhone,
          isMain: true,
        },
      });

      // 3. Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // 4. Create admin user
      const user = await tx.user.create({
        data: {
          pharmacyId: pharmacy.id,
          branchId: branch.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: Role.ADMIN,
        },
      });

      return { pharmacy, branch, user };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user.id, result.user.email, result.user.role, result.user.pharmacyId);

    return {
      user: this.sanitizeUser(result.user),
      pharmacy: result.pharmacy,
      branch: result.branch,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.pharmacyId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.pharmacyId);
      return { user: this.sanitizeUser(user), ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: Role, pharmacyId: string) {
    const payload = { sub: userId, email, role, pharmacyId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
