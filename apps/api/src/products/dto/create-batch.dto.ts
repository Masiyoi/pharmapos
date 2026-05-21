import { IsString, IsNumber, IsPositive, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBatchDto {
  @IsString()
  batchNo: string;

  @IsDateString()
  expiryDate: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  costPrice: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @IsString()
  supplierId: string;
}
