import {
  IsString, IsOptional, IsArray,
  ValidateNested, IsDateString, IsEnum, IsInt, Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionStatus } from '@prisma/client';

export class PrescriptionItemDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePrescriptionDto {
  @IsString()
  patientName: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsString()
  patientAge?: string;

  @IsOptional()
  @IsString()
  patientGender?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  doctorSpecialty?: string;

  @IsOptional()
  @IsString()
  facilityName?: string;

  @IsOptional()
  @IsString()
  labRecommendations?: string;

  @IsDateString()
  issuedDate: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
