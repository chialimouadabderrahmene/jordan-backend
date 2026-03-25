import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() registerDto: RegisterDto) {
        this.logger.log(`[REQUEST START] POST /auth/register — email=${registerDto.email}`);
        try {
            const result = await this.authService.register(registerDto);
            this.logger.log('[REQUEST END] POST /auth/register — success');
            return result;
        } catch (error) {
            this.logger.error(`[REQUEST FAIL] POST /auth/register — ${error.message}`);
            throw error;
        }
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        this.logger.log(`[REQUEST START] POST /auth/login — email=${loginDto.email}`);
        try {
            const result = await this.authService.login(loginDto);
            this.logger.log('[REQUEST END] POST /auth/login — success');
            return result;
        } catch (error) {
            this.logger.error(`[REQUEST FAIL] POST /auth/login — ${error.message}`);
            throw error;
        }
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
        this.logger.log('[REQUEST START] POST /auth/refresh');
        try {
            const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
            this.logger.log('[REQUEST END] POST /auth/refresh — success');
            return result;
        } catch (error) {
            this.logger.error(`[REQUEST FAIL] POST /auth/refresh — ${error.message}`);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate refresh token' })
    async logout(@CurrentUser('sub') userId: string) {
        this.logger.log(`[REQUEST START] POST /auth/logout — userId=${userId}`);
        try {
            await this.authService.logout(userId);
            this.logger.log('[REQUEST END] POST /auth/logout — success');
            return { message: 'Logged out successfully' };
        } catch (error) {
            this.logger.error(`[REQUEST FAIL] POST /auth/logout — ${error.message}`);
            throw error;
        }
    }
}
