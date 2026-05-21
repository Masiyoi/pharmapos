import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  pharmacyName: string;

  @IsString()
  pharmacyLicenseNo: string;

  @IsString()
  pharmacyPhone: string;

  @IsString()
  pharmacyAddress: string;

  @IsString()
  pharmacyCounty: string;
}
