import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { User } from '@/common/decorators/User.decorator';
import { frontendServer } from '@/common/configs/config';
import { PermissionGuard } from '@/common/decorators/permission-guard.decorator';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';
import { CreateLinkRdo } from '@/sharable-links/dto/create-link.rdo';
import { InterceptedUserData } from '@/user/intercepted-userData';

@Controller('drive')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @PermissionGuard('owner')
  @IsVerified()
  @AuthGuard()
  @Post('share/space')
  async createLink(
    @Body()
    body: CreateLinkDto,
    @User() user: InterceptedUserData,
  ): Promise<CreateLinkRdo> {
    const { userToShare, link } = await this.linksService.createLink(
      user.UUID,
      body,
    );
    return {
      isMailed: !!userToShare,
      link: `${frontendServer.url}/drive/set/permissions/${link}`,
    };
  }

  @IsVerified()
  @AuthGuard()
  @Post('set/permissions/:code')
  async getFile(
    @Param('code') code: string,
    @User() user: InterceptedUserData,
  ) {
    await this.linksService.updateLink(code, user);
  }
}
