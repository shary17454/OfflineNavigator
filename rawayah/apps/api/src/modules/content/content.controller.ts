import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/common/current-user.decorator';
import { JwtAuthGuard } from '../../shared/common/jwt-auth.guard';
import { PermissionGuard } from '../../shared/common/roles.guard';
import { Permissions } from '../../shared/common/roles.decorator';
import { ContentService } from './content.service';
import {
  CreateAnswerDto,
  CreateCommentDto,
  CreatePoemAttributionDto,
  CreatePoemDto,
  CreatePoemVerseDto,
  CreatePoemVerseVariantDto,
  CreatePoemVersionDto,
  SearchDto,
  FavoriteDto,
  CreateQuestionDto,
  PublishDto,
  ReviewDto,
} from './dto/content.dto';

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(private svc: ContentService) {}

  @Get('home')
  home() {
    return this.svc.getHomePage();
  }

  @Get('poets')
  poets(@Query('q') q?: string) {
    return this.svc.listPoets(q);
  }

  @Get('poets/:id')
  poet(@Param('id') id: string) {
    return this.svc.getPoet(id);
  }

  @Get('poems')
  poems(@Query('q') q?: string) {
    return this.svc.listPoems(q);
  }

  @Get('poems/:id')
  poem(@Param('id') id: string) {
    return this.svc.getPoem(id);
  }

  @Get('stories')
  stories(@Query('q') q?: string) {
    return this.svc.listStories(q);
  }

  @Get('stories/:id')
  story(@Param('id') id: string) {
    return this.svc.getStory(id);
  }

  @Get('books')
  books(@Query('q') q?: string) {
    return this.svc.listBooks(q);
  }

  @Get('books/:id')
  book(@Param('id') id: string) {
    return this.svc.getBook(id);
  }

  @Get('horses')
  horses(@Query('q') q?: string) {
    return this.svc.listHorses(q);
  }

  @Get('horses/:id')
  horse(@Param('id') id: string) {
    return this.svc.getHorse(id);
  }

  @Get('camels')
  camels(@Query('q') q?: string) {
    return this.svc.listCamels(q);
  }

  @Get('camels/:id')
  camel(@Param('id') id: string) {
    return this.svc.getCamel(id);
  }

  @Get('hunting')
  hunting(@Query('q') q?: string) {
    return this.svc.listFalcons(q);
  }

  @Get('hunting/:id')
  huntingItem(@Param('id') id: string) {
    return this.svc.getFalcon(id);
  }

  @Get('hunting-dogs')
  huntingDogs() {
    return this.svc.listHuntingDogBreeds();
  }

  @Get('hunting-dogs/:id')
  huntingDog(@Param('id') id: string) {
    return this.svc.getHuntingDogBreed(id);
  }

  @Get('proverbs')
  proverbs(@Query('q') q?: string) {
    return this.svc.listProverbs(q);
  }

  @Get('proverbs/:id')
  proverb(@Param('id') id: string) {
    return this.svc.getProverb(id);
  }

  @Get('vocabulary')
  vocabulary(@Query('q') q?: string) {
    return this.svc.listVocabulary(q);
  }

  @Get('vocabulary/:id')
  vocabularyTerm(@Param('id') id: string) {
    return this.svc.getVocabularyTerm(id);
  }

  @Get('places')
  places(@Query('q') q?: string) {
    return this.svc.listPlaces(q);
  }

  @Get('places/:id')
  place(@Param('id') id: string) {
    return this.svc.getPlace(id);
  }

  @Get('topics')
  topics(@Query('q') q?: string) {
    return this.svc.listTopics(q);
  }

  @Get('topics/:id')
  topic(@Param('id') id: string) {
    return this.svc.getTopic(id);
  }

  @Get('search')
  search(@Query() query: SearchDto) {
    return this.svc.search(query);
  }

  @Get('sections')
  sections() {
    return this.svc.sectionsConfig();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:create')
  @Post('poems')
  createPoem(@CurrentUser() user: any, @Body() dto: CreatePoemDto) {
    return this.svc.createPoem(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:submit')
  @Post('poems/:id/submit')
  submitPoem(@Param('id') id: string) {
    return this.svc.submitPoem(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:edit')
  @Post('poems/:id/versions')
  createPoemVersion(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreatePoemVersionDto) {
    return this.svc.createPoemVersion(id, dto, user.id);
  }

  @Get('poems/:id/versions')
  poemVersions(@Param('id') id: string) {
    return this.svc.listPoemVersions(id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:edit')
  @Post('poems/versions/:versionId/verses')
  createPoemVerse(@Param('versionId') versionId: string, @CurrentUser() user: any, @Body() dto: CreatePoemVerseDto) {
    return this.svc.createPoemVerse(versionId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:edit')
  @Post('poems/verses/:verseId/variants')
  createPoemVerseVariant(@Param('verseId') verseId: string, @CurrentUser() user: any, @Body() dto: CreatePoemVerseVariantDto) {
    return this.svc.createPoemVerseVariant(verseId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:edit')
  @Post('poems/:id/attributions')
  createPoemAttribution(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreatePoemAttributionDto) {
    return this.svc.createPoemAttribution(id, dto, user.id);
  }

  @Get('poems/admin/list')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('admin:read')
  listPendingPoems() {
    return this.svc.listPendingPoems();
  }

  @Get('poems/admin/all')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('admin:read')
  listAllPoems() {
    return this.svc.listAllPoems();
  }

  @Post('poems/:id/review')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:review')
  reviewPoem(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ReviewDto) {
    return this.svc.moderatePoem(id, dto.action, user.id, dto.note);
  }

  @Post('poems/:id/publish')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('content:publish')
  publishPoem(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: PublishDto) {
    return this.svc.publishPoem(id, user.id, dto.note);
  }

  @Get('admin/moderation-logs')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth()
  @Permissions('admin:read')
  moderationLogs() {
    return this.svc.getModerationQueue();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('comments')
  comment(@CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    return this.svc.createComment(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('favorites')
  favorites(@CurrentUser() user: any) {
    return this.svc.listFavorites(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('favorites')
  favorite(@CurrentUser() user: any, @Body() dto: FavoriteDto) {
    return this.svc.addFavorite(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('notifications')
  notifications(@CurrentUser() user: any) {
    return this.svc.listNotifications(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('notifications/:id/read')
  markNotificationRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.markNotificationRead(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('questions')
  askQuestion(@CurrentUser() user: any, @Body() dto: CreateQuestionDto) {
    return this.svc.createQuestion(user.id, dto);
  }

  @Get('questions')
  questions() {
    return this.svc.listQuestions();
  }

  @Get('questions/:id')
  questionDetails(@Param('id') id: string) {
    return this.svc.questionDetails(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('questions/:id/answers')
  answerQuestion(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateAnswerDto) {
    return this.svc.answerQuestion(id, user.id, dto.body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('reports')
  report(@CurrentUser() user: any, @Body() body: { contentType: string; contentId: string; reason: string; details?: string }) {
    return this.svc.reportContent(user.id, body);
  }
}
