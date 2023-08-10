import { SessionService } from './session.service';
import { SessionEntity } from './entities/sessions.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from '@/token/token.module';
import { SessionController } from '@/session/session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), TokenModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
