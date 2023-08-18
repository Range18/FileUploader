import { Controller, Delete, Get } from '@nestjs/common';
import { SessionService } from '@/session/session.service';
import { User } from '@/common/decorators/User.decorator';
import { UserPayload } from '@/user/userPayload';
import { GetSessionRdo } from '@/session/get-session.rdo';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { InterceptedUserData } from '@/user/intercepted-userData';
import { Not } from 'typeorm';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @AuthGuard()
  @Get('current/@me')
  async getCurrentSession(
    @User() user: InterceptedUserData,
  ): Promise<GetSessionRdo> {
    const session = await this.sessionService.findOne({
      where: { userUUID: user.UUID },
    });

    return this.sessionService.formatToDto(session);
  }

  @AuthGuard()
  @Get('all/@me')
  async getUserSessions(
    @User() user: InterceptedUserData,
  ): Promise<GetSessionRdo[]> {
    const sessions = await this.sessionService.find({
      where: { userUUID: user.UUID },
    });

    return sessions.map((session) => this.sessionService.formatToDto(session));
  }

  @AuthGuard()
  @Delete('logoutAll/@me')
  async removeAllSessions(@User() user: InterceptedUserData) {
    await this.sessionService.remove({
      where: { userUUID: user.UUID, sessionUUID: Not(user.sessionUUID) },
    });
  }
}
