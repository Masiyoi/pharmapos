import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { MpesaModule } from './mpesa/mpesa.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';
import { BranchesModule } from './branches/branches.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ProcurementModule } from './procurement/procurement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    MpesaModule,
    SuppliersModule,
    CustomersModule,
    ReportsModule,
    BranchesModule,
    PrescriptionsModule,
    ProcurementModule,
  ],
})
export class AppModule {}
