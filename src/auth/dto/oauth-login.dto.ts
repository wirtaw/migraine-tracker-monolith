import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OAuthProvider {
  GITHUB = 'github',
  GOOGLE = 'google',
}

export class OAuthLoginDto {
  @ApiProperty({
    description:
      'The access token returned by Supabase after successful OAuth flow on the client',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  accessToken!: string;

  @ApiProperty({
    enum: OAuthProvider,
    description: 'The provider used for authentication',
    example: OAuthProvider.GITHUB,
  })
  @IsEnum(OAuthProvider)
  provider!: OAuthProvider;
}
