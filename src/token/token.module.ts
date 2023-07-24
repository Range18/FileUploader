import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtSettings } from '@/common/configs/config';
import { TokenService } from './token.service';
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: false,
      secret: jwtSettings.secret,
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
