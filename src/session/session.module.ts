import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities/sessions.entity';
import { TokenModule } from '@/token/token.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), TokenModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
