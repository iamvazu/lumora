import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import {
  SearchQuery,
  DiscoverySearchResponse,
  FeaturedCreatorsResponse,
  CategoryDto,
} from '@lumora/contracts';

@Controller()
export class DiscoveryController {
  constructor(private discoveryService: DiscoveryService) {}

  @Get('search')
  async search(@Query() query: SearchQuery): Promise<DiscoverySearchResponse> {
    return this.discoveryService.search(query);
  }

  @Get('categories')
  async getCategories(): Promise<CategoryDto[]> {
    return this.discoveryService.getCategories();
  }

  @Get('creators/featured')
  async getFeatured(): Promise<FeaturedCreatorsResponse> {
    return this.discoveryService.getFeatured();
  }
}
