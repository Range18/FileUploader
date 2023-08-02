import { SessionService } from './session.service';
import { SessionEntity } from './entities/sessions.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from '@/token/token.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), TokenModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
