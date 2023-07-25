import { Body, Controller, Param, Post } from '@nestjs/common';
import { LinksService } from './links.service';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { User } from '@/common/decorators/User.decorator';
import { UserPayload } from '@/user/userPayload';
import { frontendServer } from '@/common/configs/config';
import { RolesGuard } from '@/common/decorators/rolesGuard.decorator';
import { CreateLinkDto } from './dto/create-link.dto';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';

@Controller('drive')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @RolesGuard('owner')
  @IsVerified()
  @AuthGuard()
  @Post('share/space')
  async createLink(
    @Body()
    body: CreateLinkDto,
    @User() user: UserPayload,
  ) {
    const { link } = await this.linksService.createLink(user.UUID, body);
    return `${frontendServer.url}/drive/set/permissions/${link}`;
  }

  @IsVerified()
  @AuthGuard()
  @Post('set/permissions/:code')
  async getFile(@Param('code') code: string, @User() user: UserPayload) {
    await this.linksService.updateLink(code, user);
  }
}
