import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async createToken(
    payload: unknown,
    options?: JwtSignOptions,
  ): Promise<string> {
    return await this.jwtService.signAsync(<string>payload, options);
  }

  async validateToken<T>(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<T> {
    return (await this.jwtService.verifyAsync(token, options)) as T;
  }
}
