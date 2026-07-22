import { Module } from '@nestjs/common';
import { CargoController } from './cargo.controller';
import { CargoService } from './cargo.service';
import { SupabaseModule } from '../../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CargoController],
  providers: [CargoService],
})
export class CargoCrudModule {}
