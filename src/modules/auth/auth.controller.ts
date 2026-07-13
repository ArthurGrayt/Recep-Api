import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

const COOKIE_NAME = 'access_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, 
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    
    res.cookie(COOKIE_NAME, result.object.accessToken, COOKIE_OPTIONS);
    
    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Successful registration' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );
    
    if (result.object?.accessToken) {
      res.cookie(COOKIE_NAME, result.object.accessToken, COOKIE_OPTIONS);
    }
    
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or reset user password using token' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(
    @Req() req: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const token =
      updatePasswordDto.token ||
      req.cookies?.[COOKIE_NAME] ||
      req.headers.authorization?.replace('Bearer ', '');
      
    if (!token) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }
    return this.authService.updatePassword(token, updatePasswordDto.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[COOKIE_NAME];
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return this.authService.logout(token);
  }
}
